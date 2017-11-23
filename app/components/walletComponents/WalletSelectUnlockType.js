import React from "react";
import { Button, ButtonGroup } from "reactstrap";

// Unlock wallet enum
const UNLOCK_WALLET_TYPE = {
  IMPORT_WALLET: 0,
  HD_WALLET: 1,
  PASTE_PRIV_KEY: 2,
};

export default class WalletSelectUnlockType extends React.Component {
  constructor(props) {
    super(props);

    this.state = { cSelected: this.props.unlockType };
  }

  onRadioBtnClick(s) {
    this.setState({
      cSelected: s,
    });

    this.props.setUnlockType(s);
  }

  render() {
    return (
      <div style={{ textAlign: `center` }}>
        <ButtonGroup vertical>
          <Button
            color="secondary"
            onClick={() => this.onRadioBtnClick(UNLOCK_WALLET_TYPE.HD_WALLET)}
            active={this.state.cSelected === UNLOCK_WALLET_TYPE.HD_WALLET}
          >
            Enter secret phrase
          </Button>
          <Button
            color="secondary"
            onClick={() => this.onRadioBtnClick(UNLOCK_WALLET_TYPE.IMPORT_WALLET)}
            active={this.state.cSelected === UNLOCK_WALLET_TYPE.IMPORT_WALLET}
          >
            Load wallet.dat
          </Button>
          <Button
            color="secondary"
            onClick={() => this.onRadioBtnClick(UNLOCK_WALLET_TYPE.PASTE_PRIV_KEY)}
            active={this.state.cSelected === UNLOCK_WALLET_TYPE.PASTE_PRIV_KEY}
          >
            Paste private key
          </Button>
        </ButtonGroup>
      </div>
    );
  }
}
