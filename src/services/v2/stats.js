import axios from 'axios';
import Web3 from 'web3';
import BigNumber from 'bignumber.js';

import erc20Abi from '@/abi/ERC20.json';
import vaultAbi from '@/abi/v2/vault.json';
import strategyAbi from '@/abi/v2/strategy.json';

import {
  getName,
  getBalance,
  fetchTokenPrice,
  toFixed,
} from '../index';

let web3;
// id 获取法币报价字段名
let vaults = [
  {
    name: 'usdt',
    id: 'tether',
  },
  {
    name: 'ycrv',
    id: 'curve-fi-ydai-yusdc-yusdt-ytusd',
    curveName: 'y',
  },
  {
    name: 'dai',
    id: 'dai',
  },
  {
    name: 'tusd',
    id: 'true-usd',
  },
  {
    name: 'usdc',
    id: 'usd-coin',
  },
  {
    name: 'eth',
    id: 'ethereum',
  }
];

// 获取配置文件
export async function getVaultsConfig() {
  const res = await axios.get('/configs/v2/config.json');
  if (res.status === 200) {
    return res.data;
  }
  return [];
}

// 初始化合约
export async function initContract(item) {
  web3 = new Web3(Web3.givenProvider);
  let tokenContract;
  let vaultContract;
  let strategyContract = {};
  tokenContract = new web3.eth.Contract(erc20Abi, item.token);
  vaultContract = new web3.eth.Contract(vaultAbi, item.vault);
  if (item.Strategy) {
    strategyContract = new web3.eth.Contract(strategyAbi, item.Strategy);
  }
  console.log(164, {
    tokenContract,
    vaultContract,
    strategyContract,
  });
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
  console.log('getTokenInfo', name);
  console.log({
    name,
    symbol,
    totalSupply,
    decimals,
  });
  return {
    name,
    symbol,
    totalSupply,
    decimals,
  };
}

// 获取机枪池名称
export async function getAssetName(contract) {
  const name = await contract.methods.name().call();
  return name;
}

// 获取策略名称
export async function getStrategyName(contract) {
  const name = await getName(contract);
  if ((name || '').indexOf('yfii:Strategy:') > -1) {
    return (name || '').split('yfii:Strategy:')[1];
  }
  console.log(123, name);
  return name;
}

// 获取年华率
export async function getStrategyAPY(list) {
  const res = await axios.get('https://api.dfi.money/apy.json');
  console.log(apyBackList);
  const apyBackList = list.map((item) => {
    const { name } = item;
    let yfiiAPY = res.data[name];
    return {
      ...item,
      yfiiAPY: toFixed(yfiiAPY, 4),
    }
  });
  return apyBackList;
}

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
      console.log(113, 'strategyContract', strategyContract);
      // 获取池子名称
      let assetName = (await getAssetName(vaultContract)) || item.assetName;
      console.log(116, 'assetName', assetName);
      // 获取池子余额
      let balance = await getBalance(vaultContract, tokenInfo);
      console.log(114, 'balance', balance);
      // 获取策略名称
      let strategyName = '';
      let strategyBalance = 0;
      if (item.Strategy) {
        strategyName = await getStrategyName(strategyContract);
        // 获取策略池内余额
        // strategyBalance = await getStrategyBalance(strategyContract, tokenInfo);
      }
      let index = vaults.findIndex(fi => fi.name === item.name);
      let vaultsData = {};
      if (index > -1) {
        vaultsData = vaults[index];
      }
      return {
        ...item,
        balance,
        assetName,
        strategyName,
        ...vaultsData,
      };
    })
  )
  // 批量获取交易所法币报价
  const priceBackData = await fetchTokenPrice(commonBack);
  // 计算 APY
  const apyBackData = await getStrategyAPY(priceBackData);
  console.log(172, apyBackData);
  return apyBackData;
}
