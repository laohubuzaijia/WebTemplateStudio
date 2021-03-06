import * as React from "react";
import { injectIntl, InjectedIntlProps } from "react-intl";
import styles from "./styles.module.css";
import messages from "./messages";

import { ReactComponent as Checkmark } from "../../../assets/checkgreen.svg";
import { ReactComponent as Warning } from "../../../assets/warning.svg";
import { IPlatformRequirement } from "../../../store/config/platform/model";
import classnames from "classnames";

interface IProps {
  item: IPlatformRequirement;
}

type Props = IProps & InjectedIntlProps;

const RequirementItem = ({ intl, item }: Props) => {
  const { formatMessage } = intl;
  return (
    <div className={styles.container}>
      {item.isInstalled && (
        <div className={styles.inLine}>
          <div role="img" aria-label={formatMessage(messages.requirementInstalled)}>
            <Checkmark className={styles.iconCheck} />
          </div>
        </div>
      )}
      {!item.isInstalled && (
        <div className={styles.inLine}>
          <div role="img" aria-label={formatMessage(messages.requirementNotInstalled)}>
            <Warning className={styles.iconWarning} />
          </div>
        </div>
      )}
      <div className={classnames({ [styles.warningText]: !item.isInstalled })}>{item.name}</div>
    </div>
  );
};

export default injectIntl(RequirementItem);
