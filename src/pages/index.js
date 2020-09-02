import React from 'react';
import { connect } from 'dva';
import BigNumber from 'bignumber.js';
import Container from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import CircularProgress from '@material-ui/core/CircularProgress';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { Description } from '@material-ui/icons';

import styles from './index.less';

const StatsPage = ({ stats }) => {
  const { vaultsList } = stats;

  let total = 0;
  vaultsList.forEach(item => (total += +item.balancePrice));

  return (
    <div className={styles.statsPage}>
      <Container>
        <h1 className={styles.title}>Total Value Locked</h1>
        <Box
          display="flex"
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          className={styles.header}
        >
          <Grid item xs={4}>
            <Box boxShadow={2} className={styles.list}>
              <Box
                display="flex"
                flexDirection="row"
                justifyContent="space-between"
                className={styles.listItem}
              >
                <span>Total</span>
                <span>${(+total).toLocaleString()}</span>
              </Box>
            </Box>
          </Grid>
        </Box>
        <Box className={styles.content}>
          <Grid container direction="row" justify="center" alignItems="center">
            <Grid item xs={12}>
              <h2>vaults</h2>
              <TableContainer>
                <Table className={styles.table}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Asset</TableCell>
                      <TableCell align="right">Strategy</TableCell>
                      <TableCell align="right">ROI weekly / APY</TableCell>
                      <TableCell align="right">Liquidity in vault</TableCell>
                      {/* <TableCell align="right">Invested by strategy</TableCell> */}
                    </TableRow>
                  </TableHead>
                  {(vaultsList || []).length ? (
                    <TableBody>
                      {(vaultsList || [])
                        .filter(fi => +fi.balance > 0)
                        .map(row => (
                          <TableRow key={row.token}>
                            <TableCell>
                              <Box
                                display="flex"
                                flexDirection="row"
                                alignItems="center"
                              >
                                <a
                                  href={`https://etherscan.io/address/${row.vault}`}
                                  target="_blank"
                                >
                                  <Description fontSize="small" />
                                </a>
                                <span>{row.assetName}</span>(
                                <a
                                  href={`https://etherscan.io/token/${row.token}`}
                                  target="_blank"
                                >
                                  {row.name}
                                </a>
                                )
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <a
                                href={`https://etherscan.io/address/${row.strategy}`}
                                target="_blank"
                              >
                                {row.strategyName}
                              </a>
                            </TableCell>
                            <TableCell align="right">
                              <div>
                                <span>
                                  {row.yfiiWeeklyROI || '-'}% /
                                  {row.yfiiAPY || '-'}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell align="right">
                              <span>{(+row.balance).toLocaleString()}</span>
                              &nbsp;
                              <a
                                href={`https://etherscan.io/token/${row.token}`}
                                target="_blank"
                              >
                                {row.name}
                              </a>
                              &nbsp; (${(+row.balancePrice).toLocaleString()})
                            </TableCell>
                            {/* <TableCell align="right">
                                <span>{(+row.strategyBalance).toLocaleString()}</span>
                                &nbsp;
                                <a href={`https://etherscan.io/token/${row.token}`} target="_blank">
                                  {row.name}
                                </a>
                              </TableCell> */}
                          </TableRow>
                        ))}
                    </TableBody>
                  ) : null}
                </Table>
              </TableContainer>
              {(vaultsList || []).length ? null : (
                <Box
                  display="flex"
                  flexDirection="columns"
                  justifyContent="center"
                  alignItems="center"
                  className={styles.tableLoading}
                >
                  <CircularProgress />
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>
      </Container>
    </div>
  );
};

export default connect(({ stats }) => ({ stats }))(StatsPage);
