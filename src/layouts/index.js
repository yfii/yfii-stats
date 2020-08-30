import React from 'react';

import styles from './styles.less';

const BaseLayout = ({
  children,
}) => {
  return (
    <div className={styles.layout}>
      {children}
    </div>
  )
}

export default BaseLayout;
