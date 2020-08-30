import { getVaultsList } from '../services/stats';

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
