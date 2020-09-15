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
  await getOldPoolData();
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

  let oldPoolData = await getOldPoolData();
  oldPoolData.push(...apyBackData)
  console.log(172, oldPoolData);
  return oldPoolData;
  // return apyBackData;
}

export async function getOldPoolData() {
  const res = await axios.get('https://api.coinmarketcap.com/data-api/v1/farming/yield/latest');
  const farmingProjects = res.data.data.farmingProjects;
  const oldPoolIndex = farmingProjects.findIndex(fi => fi.name === "yfii.finance");
  const oldPoolAllData = farmingProjects[oldPoolIndex].poolList;
  console.log(oldPoolAllData)
  const oldPoolData = [{
    Strategy: "0xb81D3cB2708530ea990a287142b82D058725C092",
    assetName: oldPoolAllData[0].name,
    balancePrice: oldPoolAllData[0].totalStake,
    id: oldPoolAllData[0].id,
    name: oldPoolAllData[0].pair,
    strategyName: oldPoolAllData[0].name,
    token: "0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8",
    vault: "0xb81D3cB2708530ea990a287142b82D058725C092",
    yfiiWeeklyROI: toFixed(oldPoolAllData[0].weeklyROI, 4),
    yfiiAPY: toFixed(oldPoolAllData[0].yearlyROI, 4)
  },
  {
    Strategy: "0xAFfcD3D45cEF58B1DfA773463824c6F6bB0Dc13a",
    assetName: oldPoolAllData[1].name,
    balancePrice: oldPoolAllData[1].totalStake,
    id: oldPoolAllData[1].id,
    name: oldPoolAllData[1].pair,
    strategyName: oldPoolAllData[1].name,
    token: "0x16cAC1403377978644e78769Daa49d8f6B6CF565",
    vault: "0xAFfcD3D45cEF58B1DfA773463824c6F6bB0Dc13a",
    yfiiWeeklyROI: toFixed(oldPoolAllData[1].weeklyROI, 4),
    yfiiAPY: toFixed(oldPoolAllData[1].yearlyROI, 4)
  }]
  return oldPoolData;
}
