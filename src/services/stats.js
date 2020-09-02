import axios from 'axios';
import Web3 from 'web3';
import BigNumber from 'bignumber.js';

import erc20Abi from '@/abi/ERC20.json';
import vaultAbi from '@/abi/vault.json';
import strategyAbi from '@/abi/strategy.json';

import { getCurveAPY } from './curve';

let web3;
// 自定义机枪池配置
// id 获取法币报价字段名
let vaults = [
  {
    name: 'SNX',
    id: 'havven',
  },
  {
    name: 'LEND',
    id: 'ethlend',
  },
  {
    name: 'MKR',
    id: 'maker',
  },
  {
    name: 'YFI',
    id: 'yearn-finance',
  },
  {
    name: 'COMP',
    id: 'compound-coin',
  },
  {
    name: 'WBTC',
    id: 'wrapped-bitcoin',
  },
  {
    name: 'YCRV',
    id: 'curve-fi-ydai-yusdc-yusdt-ytusd',
    curveName: 'y',
  },
  {
    name: 'YFII',
    id: 'yfii-finance',
  },
  {
    name: 'USDC',
    id: 'usd-coin',
  },
  {
    name: 'CCRV(cDAI+cUSDC)',
    id: 'curve-fi-ydai-yusdc-yusdt-ytusd',
    curveName: 'compound',
  },
];

// 策略池配置
const STRATEGYPOOLS = {
  "GRAP": {
    // 池子名称 => 对应 /public/abi/${name}
    strategyNameType: 'grap',
    // 挖出币的交易所 id => 对应 /public/configs/coingecko-coin.json 相应的 id
    vaultToken: 'grap-finance',
  },
  "ZOMBIE.FINANCE": {
    strategyNameType: 'zombie',
    vaultToken: 'zombie-finance',
  },
  "YFII.finance": {
    strategyNameType: 'yfii',
    vaultToken: 'yfii-finance',
  },
  "Curve DAO Token": {
    strategyNameType: 'curve',
    vaultToken: 'curve-dao-token',
  },
};

// 获取配置文件
export async function getVaultsConfig() {
  const res = await axios.get('/configs/config.json');
  if (res.status === 200) {
    return res.data;
  }
  return [];
}

// 获取 Strategy 配置
export function getStrategyPool(strategyName) {
  const [, name] = strategyName.split(':');
  console.log(86, strategyName, name, STRATEGYPOOLS[name]);
  if (strategyName) {
    return STRATEGYPOOLS[name];
  }
  return {};
}

// 合并机枪池配置至本地配置
export async function getVaultsList() {
  const config = await getVaultsConfig();
  let commonBack = await Promise.all(
    (config || []).map(async item => {
      // 初始化合约
      const {
        tokenContract,
        vaultContract,
        strategyContract,
      } = await initContract(item);
      // 获取币种信息
      let tokenInfo = await getTokenInfo(tokenContract, item);
      // 获取池子名称
      let assetName = (await getAssetName(vaultContract)) || item.assetName;
      // 获取池子余额
      let balance = await getBalance(vaultContract, tokenInfo);
      // 获取策略名称
      let strategyName = '';
      let strategyBalance = 0;
      if (item.strategy) {
        strategyName = await getStrategyName(strategyContract);
        // 获取策略池内余额
        strategyBalance = await getStrategyBalance(strategyContract, tokenInfo);
      }
      let index = vaults.findIndex(fi => fi.name === item.name);
      let vaultsData = {};
      if (index > -1) {
        vaultsData = vaults[index];
      }
      return {
        ...item,
        assetName,
        strategyName,
        balance,
        strategyBalance,
        strategyContract,
        vaultContract,
        ...vaultsData,
      };
    }),
  );
  // 批量获取交易所法币报价
  const priceBackData = await fetchTokenPrice(commonBack);
  // 计算 APY
  const apyBackData = await getStrategyAPY(priceBackData);
  // console.log(100, apyBackData);
  return apyBackData;
}

// 初始化合约
export async function initContract(item) {
  web3 = new Web3(Web3.givenProvider);
  let tokenContract;
  let vaultContract;
  let strategyContract = {};
  tokenContract = new web3.eth.Contract(erc20Abi, item.token);
  vaultContract = new web3.eth.Contract(vaultAbi, item.vault);
  if (item.strategy) {
    strategyContract = new web3.eth.Contract(strategyAbi, item.strategy);
  }
  return {
    tokenContract,
    vaultContract,
    strategyContract,
  };
}

// 获取必要 token 信息
export async function getTokenInfo(contract, item = {}) {
  let name = item.name || '';
  let totalSupply = '0';
  let decimals = '18';
  let symbol = item.name || '';
  try {
    // for MKR name&symbol 不标准
    name = await contract.methods.name().call();
    symbol = await contract.methods.symbol().call();
  } catch (e) {
    // console.log('getTokenInfo', e);
  }
  try {
    totalSupply = await contract.methods.totalSupply().call();
    decimals = await contract.methods.decimals().call();
  } catch (e) {
    // console.log('getTokenInfo', e);
  }
  return {
    name,
    symbol,
    totalSupply,
    decimals,
  };
}

// 获取机枪池名称
export async function getAssetName(contract) {
  const name = await getName(contract);
  if ((name || '').indexOf('yfii:Vault:') > -1) {
    return (name || '').split('yfii:Vault:')[1];
  }
  return name;
}

// 获取策略名称
export async function getStrategyName(contract) {
  const name = await getName(contract);
  if ((name || '').indexOf('yfii:Strategy:') > -1) {
    return (name || '').split('yfii:Strategy:')[1];
  }
  return name;
}

// 获取年华率
export async function getStrategyAPY(list) {
  const apyBackList = await Promise.all(
    list.map(async item => {
      const {
        name,
        curveName,
        balance,
        strategy,
        strategyName,
        strategyContract,
      } = item;
      let yfiiDailyAPY = 0;
      let yfiiWeeklyAPY = 0;
      let yfiiAPY = 0;
      let now = new Date().getTime();
      // 策略池子名称, 挖出的 token
      const { strategyNameType, vaultToken } = getStrategyPool(strategyName);
      if (!strategyNameType || !vaultToken) { return item }
      try {
        // 获取投资池子地址
        pool = await strategyContract.methods.pool().call();
      } catch (e) {
      }
      let pool;
      // grap 池 && zombie 池年华计算
      if (pool) {
        // 获取策略池信息
        const { rewardRate, totalSupply, periodFinish } = await getPoolInfo(
          pool,
          strategyNameType,
          name,
        );
        // 矿已经挖完了
        if (now > periodFinish) {
          return {
            ...item,
            yfiiWeeklyROI: 0,
            yfiiAPY: 0,
          };
        }
        // 产出
        const daily_reward = rewardRate * 86400;
        const weekly_reward = rewardRate * 604800;
        const year_reward = rewardRate * 31536000;
        // 产出比例
        const daily_rewardPerToken = daily_reward / totalSupply;
        const weekly_rewardPerToken = weekly_reward / totalSupply;
        const year_rewardPerToken = year_reward / totalSupply;
        // 挖出币价格
        const strategyPrice = await getTokenPrice(list, vaultToken);
        // 本金币价格
        const vaultPrice = await getTokenPrice(list, name);
        // ROI = 日产出占比 & 挖出币的价格 * 100 / 本金
        const yfiiDailyROI =
          (daily_rewardPerToken * strategyPrice * 100) / vaultPrice;
        const yfiiWeeklyROI =
          (weekly_rewardPerToken * strategyPrice * 100) / vaultPrice;
        const yfiiYearROI =
          (year_rewardPerToken * strategyPrice * 100) / vaultPrice;
        // APY
        yfiiDailyAPY = ((1 + yfiiDailyROI / 100) ** 365 - 1) * 100;
        yfiiWeeklyAPY = ((1 + yfiiWeeklyROI / 100) ** 52 - 1) * 100;
        yfiiAPY = yfiiYearROI;

        console.log(177);
        console.log(name, 'rewardRate', rewardRate);
        console.log(name, 'totalSupply', totalSupply);
        console.log(name, 'reward', daily_reward, weekly_reward);
        console.log(
          name,
          'rewardPerToken',
          daily_rewardPerToken,
          weekly_rewardPerToken,
        );
        console.log(name, 'price', strategyPrice, vaultPrice);
        console.log(name, 'ROI', yfiiDailyROI, yfiiWeeklyROI);
        console.log(
          name,
          'Daily ROI in USD',
          `${toFixed(yfiiDailyROI, 4)}%`,
        );
        console.log(
          name,
          'APY (Daily)',
          `${toFixed(((1 + yfiiDailyROI / 100) ** 365 - 1) * 100, 4)}%`,
        );
        console.log(
          name,
          'Weekly ROI in USD',
          `${toFixed(yfiiWeeklyROI, 4)}%`,
        );
        console.log(
          name,
          'APY (Weekly)',
          `${toFixed(((1 + yfiiWeeklyROI / 100) ** 52 - 1) * 100, 4)}%`,
        );
        console.log(
          name,
          'APY (unstable)',
          `${toFixed(yfiiAPY, 4)}%`,
        );
        return {
          ...item,
          // yfiiDailyROI: toFixed(yfiiDailyROI, 4),
          yfiiWeeklyROI: toFixed(yfiiWeeklyROI, 4),
          // yfiiDailyAPY: toFixed(yfiiDailyAPY, 4),
          // yfiiWeeklyAPY: toFixed(yfiiWeeklyAPY, 4),
          yfiiAPY: toFixed(yfiiAPY, 4),
        };
      }
      // Curve 池年华计算
      if (strategyNameType === 'curve') {
        yfiiAPY = getCurveAPY(vaultToken);
        // [yfiiAPY] = await getCurveAPY(curveName);
        return {
          ...item,
          // yfiiDailyAPY,
          // yfiiWeeklyAPY,
          yfiiAPY
        };
      }
      return item;
    }),
  );
  return apyBackList;
}

// 获取投资池子 & totalSupply
export async function getPoolInfo(pool, strategy, token) {
  let poolConract;
  let abi = await axios.get(`/abi/${strategy}/${token}.json`);
  try {
    poolConract = new web3.eth.Contract(abi.data, pool);
  } catch (e) {
    console.log(e);
  }
  let rewardRate, totalSupply, periodFinish;
  if (poolConract) {
    rewardRate = await poolConract.methods.rewardRate().call();
    totalSupply = await poolConract.methods.totalSupply().call();
    periodFinish = await poolConract.methods.periodFinish().call();
  }
  // console.log(200, token, rewardRate, rate);
  return {
    rewardRate: +new BigNumber(rewardRate)
      .dividedBy(new BigNumber(1e18)),
    totalSupply: +new BigNumber(totalSupply)
      .dividedBy(new BigNumber(1e18)),
    periodFinish: +periodFinish * 1000,
  };
}

// 获取 Curve 池子年化率
// export async function getCurveAPY(token) {
//   const res = await axios.get(`https://www.curve.fi/raw-stats/apys.json`);
//   let yfiiDailyAPY;
//   let yfiiWeeklyAPY;
//   let yfiiAPY;
//   try {
//     yfiiDailyAPY = res.data.apy.day[token];
//     yfiiWeeklyAPY = res.data.apy.week[token];
//     yfiiAPY = res.data.apy.total[token];
//   } catch (e) {
//     console.log(e);
//   }
//   // console.log(token, yfiiDailyAPY, yfiiWeeklyAPY);
//   // return [toFixed(yfiiDailyAPY * 100, 4), toFixed(yfiiWeeklyAPY * 100, 4)];
//   return [toFixed(yfiiAPY * 100), 4];
// }

// 获取名称方法
export async function getName(contract) {
  const name = await contract.methods.getName().call();
  return name;
}

// 获取策略目标池子地址
export async function getPool(contract) {
  let pool;
  if (contract.methods.pool) {
    pool = await contract.methods.pool().call();
  }
  return pool;
}

// 获取池内余额
export async function getBalance(contract, tokenInfo) {
  const { decimals } = tokenInfo;
  let balance = 0;
  try {
    balance = await contract.methods.balance().call();
  } catch (e) {}
  let decimalsValue = new BigNumber(10).exponentiatedBy(decimals);
  // console.log(133, name, decimals, balanceValue);
  return new BigNumber(balance).dividedBy(decimalsValue).toFixed(0);
}

// 获取策略池内余额
export async function getStrategyBalance(contract, tokenInfo) {
  const { decimals } = tokenInfo;
  let strategyBalance = 0;
  try {
    strategyBalance = await contract.methods.balanceOf().call();
  } catch (e) {}
  let decimalsValue = new BigNumber(10).exponentiatedBy(decimals);
  return new BigNumber(strategyBalance).dividedBy(decimalsValue).toFixed(0);
}

// 获取法币报价
export async function fetchTokenPrice(data) {
  let tokens = data.map(item => (item.id || item.name).toLocaleLowerCase());
  const res = await axios.get(
    `https://api.coingecko.com/api/v3/simple/price?ids=${tokens}&vs_currencies=usd`,
  );
  return data.map(item => {
    const { name, balance } = item;
    const id = (item.id || name).toLocaleLowerCase();
    let usd = 0;
    let balancePrice = 0;
    try {
      usd = res.data[id].usd || 0;
      balancePrice = new BigNumber(balance)
        .multipliedBy(new BigNumber(usd))
        .toFixed(2);
    } catch (e) {
      console.log(192, e);
    }
    return {
      ...item,
      price: {
        usd: usd || 0,
      },
      balancePrice,
    };
  });
}

// 遍历获取 token 价格
export async function getTokenPrice(list, token) {
  const index = list.findIndex(item => item.name === token);
  let usd = 0;
  try {
    if (index > -1) {
      const { price } = list[index];
      usd = price.usd;
    } else {
      console.log(435, token);
      const { data } = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=usd`,
      );
      usd = data[token].usd;
    }
  } catch (e) {
    console.log(e);
  }
  return usd;
}

const toFixed = function(num, fixed) {
  const re = new RegExp('^-?\\d+(?:.\\d{0,' + (fixed || -1) + '})?');
  const arr = num.toString().match(re);
  if (arr && arr.length > 0) {
    return arr[0];
  } else {
    return '0';
  }
};
