// import { getVaultsList } from '../services/stats';
import { getVaultsList } from '../services/v2/stats';

export default {
  state: {
    vaultsList: [],
  },
  subscriptions: {
    setup({ dispatch, history }) {
      history.listen(({ pathname }) => {
        if (pathname === '/') {
          dispatch({ type: 'getVaultsList' });
        }
      });
    }
  },
  effects: {
    *getVaultsList(_, { put, call }) {
      const res = yield call(getVaultsList);
      console.log(res);
      yield put({
        type: 'updateState',
        payload: {
          vaultsList: res,
        },
      });
    }
  },
  reducers: {
    updateState(state, action) {
      return {
        ...state,
        ...action.payload,
      };
    },
  }
}
