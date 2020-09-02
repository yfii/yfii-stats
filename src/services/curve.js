import Web3 from 'web3';
import axios from 'axios';

const multicall_address = '0xeefba1e63905ef1d7acba5a8513c70307c1ce441';
const multicall_abi = [{"constant":true,"inputs":[],"name":"getCurrentBlockTimestamp","outputs":[{"name":"timestamp","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"components":[{"name":"target","type":"address"},{"name":"callData","type":"bytes"}],"name":"calls","type":"tuple[]"}],"name":"aggregate","outputs":[{"name":"blockNumber","type":"uint256"},{"name":"returnData","type":"bytes[]"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getLastBlockHash","outputs":[{"name":"blockHash","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"addr","type":"address"}],"name":"getEthBalance","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getCurrentBlockDifficulty","outputs":[{"name":"difficulty","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getCurrentBlockGasLimit","outputs":[{"name":"gaslimit","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getCurrentBlockCoinbase","outputs":[{"name":"coinbase","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"blockNumber","type":"uint256"}],"name":"getBlockHash","outputs":[{"name":"blockHash","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"}]
const swap_abi = [{"name":"TokenExchange","inputs":[{"type":"address","name":"buyer","indexed":true},{"type":"int128","name":"sold_id","indexed":false},{"type":"uint256","name":"tokens_sold","indexed":false},{"type":"int128","name":"bought_id","indexed":false},{"type":"uint256","name":"tokens_bought","indexed":false}],"anonymous":false,"type":"event"},{"name":"TokenExchangeUnderlying","inputs":[{"type":"address","name":"buyer","indexed":true},{"type":"int128","name":"sold_id","indexed":false},{"type":"uint256","name":"tokens_sold","indexed":false},{"type":"int128","name":"bought_id","indexed":false},{"type":"uint256","name":"tokens_bought","indexed":false}],"anonymous":false,"type":"event"},{"name":"AddLiquidity","inputs":[{"type":"address","name":"provider","indexed":true},{"type":"uint256[4]","name":"token_amounts","indexed":false},{"type":"uint256[4]","name":"fees","indexed":false},{"type":"uint256","name":"invariant","indexed":false},{"type":"uint256","name":"token_supply","indexed":false}],"anonymous":false,"type":"event"},{"name":"RemoveLiquidity","inputs":[{"type":"address","name":"provider","indexed":true},{"type":"uint256[4]","name":"token_amounts","indexed":false},{"type":"uint256[4]","name":"fees","indexed":false},{"type":"uint256","name":"token_supply","indexed":false}],"anonymous":false,"type":"event"},{"name":"RemoveLiquidityImbalance","inputs":[{"type":"address","name":"provider","indexed":true},{"type":"uint256[4]","name":"token_amounts","indexed":false},{"type":"uint256[4]","name":"fees","indexed":false},{"type":"uint256","name":"invariant","indexed":false},{"type":"uint256","name":"token_supply","indexed":false}],"anonymous":false,"type":"event"},{"name":"CommitNewAdmin","inputs":[{"type":"uint256","name":"deadline","indexed":true,"unit":"sec"},{"type":"address","name":"admin","indexed":true}],"anonymous":false,"type":"event"},{"name":"NewAdmin","inputs":[{"type":"address","name":"admin","indexed":true}],"anonymous":false,"type":"event"},{"name":"CommitNewParameters","inputs":[{"type":"uint256","name":"deadline","indexed":true,"unit":"sec"},{"type":"uint256","name":"A","indexed":false},{"type":"uint256","name":"fee","indexed":false},{"type":"uint256","name":"admin_fee","indexed":false}],"anonymous":false,"type":"event"},{"name":"NewParameters","inputs":[{"type":"uint256","name":"A","indexed":false},{"type":"uint256","name":"fee","indexed":false},{"type":"uint256","name":"admin_fee","indexed":false}],"anonymous":false,"type":"event"},{"outputs":[],"inputs":[{"type":"address[4]","name":"_coins"},{"type":"address[4]","name":"_underlying_coins"},{"type":"address","name":"_pool_token"},{"type":"uint256","name":"_A"},{"type":"uint256","name":"_fee"}],"constant":false,"payable":false,"type":"constructor"},{"name":"get_virtual_price","outputs":[{"type":"uint256","name":""}],"inputs":[],"constant":true,"payable":false,"type":"function","gas":1570535},{"name":"calc_token_amount","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256[4]","name":"amounts"},{"type":"bool","name":"deposit"}],"constant":true,"payable":false,"type":"function","gas":6103471},{"name":"add_liquidity","outputs":[],"inputs":[{"type":"uint256[4]","name":"amounts"},{"type":"uint256","name":"min_mint_amount"}],"constant":false,"payable":false,"type":"function","gas":9331701},{"name":"get_dy","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"int128","name":"i"},{"type":"int128","name":"j"},{"type":"uint256","name":"dx"}],"constant":true,"payable":false,"type":"function","gas":3489637},{"name":"get_dy_underlying","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"int128","name":"i"},{"type":"int128","name":"j"},{"type":"uint256","name":"dx"}],"constant":true,"payable":false,"type":"function","gas":3489467},{"name":"exchange","outputs":[],"inputs":[{"type":"int128","name":"i"},{"type":"int128","name":"j"},{"type":"uint256","name":"dx"},{"type":"uint256","name":"min_dy"}],"constant":false,"payable":false,"type":"function","gas":7034253},{"name":"exchange_underlying","outputs":[],"inputs":[{"type":"int128","name":"i"},{"type":"int128","name":"j"},{"type":"uint256","name":"dx"},{"type":"uint256","name":"min_dy"}],"constant":false,"payable":false,"type":"function","gas":7050488},{"name":"remove_liquidity","outputs":[],"inputs":[{"type":"uint256","name":"_amount"},{"type":"uint256[4]","name":"min_amounts"}],"constant":false,"payable":false,"type":"function","gas":241191},{"name":"remove_liquidity_imbalance","outputs":[],"inputs":[{"type":"uint256[4]","name":"amounts"},{"type":"uint256","name":"max_burn_amount"}],"constant":false,"payable":false,"type":"function","gas":9330864},{"name":"commit_new_parameters","outputs":[],"inputs":[{"type":"uint256","name":"amplification"},{"type":"uint256","name":"new_fee"},{"type":"uint256","name":"new_admin_fee"}],"constant":false,"payable":false,"type":"function","gas":146045},{"name":"apply_new_parameters","outputs":[],"inputs":[],"constant":false,"payable":false,"type":"function","gas":133452},{"name":"revert_new_parameters","outputs":[],"inputs":[],"constant":false,"payable":false,"type":"function","gas":21775},{"name":"commit_transfer_ownership","outputs":[],"inputs":[{"type":"address","name":"_owner"}],"constant":false,"payable":false,"type":"function","gas":74452},{"name":"apply_transfer_ownership","outputs":[],"inputs":[],"constant":false,"payable":false,"type":"function","gas":60508},{"name":"revert_transfer_ownership","outputs":[],"inputs":[],"constant":false,"payable":false,"type":"function","gas":21865},{"name":"withdraw_admin_fees","outputs":[],"inputs":[],"constant":false,"payable":false,"type":"function","gas":23448},{"name":"kill_me","outputs":[],"inputs":[],"constant":false,"payable":false,"type":"function","gas":37818},{"name":"unkill_me","outputs":[],"inputs":[],"constant":false,"payable":false,"type":"function","gas":21955},{"name":"coins","outputs":[{"type":"address","name":""}],"inputs":[{"type":"int128","name":"arg0"}],"constant":true,"payable":false,"type":"function","gas":2130},{"name":"underlying_coins","outputs":[{"type":"address","name":""}],"inputs":[{"type":"int128","name":"arg0"}],"constant":true,"payable":false,"type":"function","gas":2160},{"name":"balances","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"int128","name":"arg0"}],"constant":true,"payable":false,"type":"function","gas":2190},{"name":"A","outputs":[{"type":"uint256","name":""}],"inputs":[],"constant":true,"payable":false,"type":"function","gas":2021},{"name":"fee","outputs":[{"type":"uint256","name":""}],"inputs":[],"constant":true,"payable":false,"type":"function","gas":2051},{"name":"admin_fee","outputs":[{"type":"uint256","name":""}],"inputs":[],"constant":true,"payable":false,"type":"function","gas":2081},{"name":"owner","outputs":[{"type":"address","name":""}],"inputs":[],"constant":true,"payable":false,"type":"function","gas":2111},{"name":"admin_actions_deadline","outputs":[{"type":"uint256","unit":"sec","name":""}],"inputs":[],"constant":true,"payable":false,"type":"function","gas":2141},{"name":"transfer_ownership_deadline","outputs":[{"type":"uint256","unit":"sec","name":""}],"inputs":[],"constant":true,"payable":false,"type":"function","gas":2171},{"name":"future_A","outputs":[{"type":"uint256","name":""}],"inputs":[],"constant":true,"payable":false,"type":"function","gas":2201},{"name":"future_fee","outputs":[{"type":"uint256","name":""}],"inputs":[],"constant":true,"payable":false,"type":"function","gas":2231},{"name":"future_admin_fee","outputs":[{"type":"uint256","name":""}],"inputs":[],"constant":true,"payable":false,"type":"function","gas":2261},{"name":"future_owner","outputs":[{"type":"address","name":""}],"inputs":[],"constant":true,"payable":false,"type":"function","gas":2291}];

const web3 = new Web3(Web3.givenProvider);

const ratesCalls = [
  [
    ["0x7ca5b0a2910B33e9759DC7dDB0413949071D7575", "0x180692d0"],
    ["0x7ca5b0a2910B33e9759DC7dDB0413949071D7575", "0x17e28089"],
  ]
];
const weightCalls = [["0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB","0x6207d8660000000000000000000000007ca5b0a2910b33e9759dc7ddb0413949071d7575"],["0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB","0x6207d866000000000000000000000000bc89cd85491d81c6ad2954e6d0362ee29fca8f53"],["0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB","0x6207d866000000000000000000000000fa712ee4788c042e2b7bb55e6cb8ec569c4530c1"],["0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB","0x6207d86600000000000000000000000069fb7c45726cfe2badee8317005d3f94be838840"],["0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB","0x6207d86600000000000000000000000064e3c23bfc40722d3b649844055f1d51c1ac041d"],["0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB","0x6207d866000000000000000000000000b1f2cdec61db658f091671f5f199635aef202cac"],["0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB","0x6207d866000000000000000000000000a90996896660decc6e997655e065b23788857849"],["0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB","0x6207d866000000000000000000000000705350c4bcd35c9441419ddd5d2f097d7a55410f"]];
const pools = {
		compound: {
			swap: '0xA2B47E3D5c44877cca798226B7B8118F9BFb7A56',
			swap_token: '0x845838DF265Dcd2c412A1Dc9e959c7d08537f8a2',
			name: 'compound',
		},
		usdt: {
			swap: '0x52EA46506B9CC5Ef470C5bf89f17Dc28bB35D85C',
			swap_token: '0x9fC689CCaDa600B6DF723D9E47D84d76664a1F23',
			name: 'usdt',
		},
		y: {
			swap: '0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51',
			swap_token: '0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8',
			name: 'y',
		},
		busd: {
			swap: '0x79a8C46DeA5aDa233ABaFFD40F3A0A2B1e5A4F27',
			swap_token: '0x3B3Ac5386837Dc563660FB6a0937DFAa5924333B',
			name: 'busd',
		},
		susdv2: {
			swap: '0xA5407eAE9Ba41422680e2e00537571bcC53efBfD',
			swap_token: '0xC25a3A3b969415c80451098fa907EC722572917F',
			name: 'susdv2',
		},
		pax: {
			swap: '0x06364f10B501e868329afBc005b3492902d6C763',
			swap_token: '0xD905e2eaeBe188fc92179b6350807D8bd91Db0D8',
			name: 'pax',
		},
		ren: {
			swap: '0x93054188d876f558f4a66B2EF1d97d16eDf0895B',
			swap_token: '0x49849C98ae39Fff122806C06791Fa73784FB3675',
			name: 'ren',
		},
		sbtc: {
			swap: '0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714',
			swap_token: '0x075b1bb99792c9E1041bA13afEf80C91a1e70fB3',
			name: 'sbtc',
		},
	};

let multicall;
export const getCurveAPY = async (token) => {
  multicall = new web3.eth.Contract(multicall_abi, multicall_address);

  let aggCallsWeights = await multicall.methods.aggregate(weightCalls).call()
  let decodedWeights = aggCallsWeights[1].map((hex, i) => [weightCalls[i][0], web3.eth.abi.decodeParameter('uint256', hex) / 1e18])
  let aggRates = await multicall.methods.aggregate(ratesCalls.flat()).call();
	let decodedRate = aggRates[1].map(hex => web3.eth.abi.decodeParameter('uint256', hex))
	let gaugeRates = decodedRate.filter((_, i) => i % 2 == 0).map(v => v / 1e18)
	let workingSupplies = decodedRate.filter((_, i) => i % 2 == 1).map(v => v / 1e18)
  let i = 0;
  let _working_supply = workingSupplies[i];
  let w = decodedWeights[i];
  let virtual_price = await getVirtualPrice('compound');
  let tokenPrice = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=usd`)
  let CRVprice = tokenPrice.data.[token].usd;
  let rate = (gaugeRates[i] * w[1] * 31536000 / _working_supply * 0.4) / virtual_price;
	let apy = rate * CRVprice * 100;
  // console.log(189, 'rate', gaugeRates[i], w[1], _working_supply, virtual_price);
  // console.log(189, 'apy', apy);
  return apy;
}

const getVirtualPrice = async (pool) => {
  let example_pool = new web3.eth.Contract(swap_abi, '0xA5407eAE9Ba41422680e2e00537571bcC53efBfD');
  let virtualPriceCalls = Object.values(pools).map(v => [v.swap, example_pool.methods.get_virtual_price().encodeABI()])
  let aggVirtualPrices = await multicall.methods.aggregate(virtualPriceCalls).call()
  let decodedVirtualPrices = aggVirtualPrices[1].map((hex, i) => [virtualPriceCalls[i][0], web3.eth.abi.decodeParameter('uint256', hex) / 1e18])
  let swap_address = pools[pool].swap
  let virtual_price = decodedVirtualPrices.find(v => v[0].toLowerCase() == swap_address.toLowerCase())[1];
  return virtual_price;
}
