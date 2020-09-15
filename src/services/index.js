import axios from 'axios';
import BigNumber from 'bignumber.js';

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

// 获取名称方法
export async function getName(contract) {
  const name = await contract.methods.getName().call();
  return name;
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

export function toFixed(num, fixed) {
  const re = new RegExp('^-?\\d+(?:.\\d{0,' + (fixed || -1) + '})?');
  const arr = num.toString().match(re);
  if (arr && arr.length > 0) {
    return arr[0];
  } else {
    return '0';
  }
};
