import React from "react";
import { Input, InputGroup, InputGroupButton, Button } from "reactstrap";

import MDCopy from "react-icons/lib/md/content-copy";
import zencashjs from "zencashjs";

import CopyToClipboard from "react-copy-to-clipboard";

export default class WalletGenerator extends React.Component {
  constructor(props) {
    super(props);

    this.handlePasswordPhrase = this.handlePasswordPhrase.bind(this);
    this.state = {
      passwordPhrase: ``,
      privateKey: ``,
    };
  }

  handlePasswordPhrase(e) {
    // What wif format do we use?
    const wifHash = this.props.settings.useTestNet
      ? zencashjs.config.testnet.wif
      : zencashjs.config.mainnet.wif;

    const pk = zencashjs.address.mkPrivKey(e.target.value);
    let pkwif = zencashjs.address.privKeyToWIF(pk, true, wifHash);

    if (e.target.value === ``) {
      pkwif = ``;
    }

    this.setState({
      privateKey: pkwif,
    });
  }

  render() {
    return (
      <div>
        <h3 className="display-6">Generate New Address</h3>
        <br />
        <InputGroup>
          <Input
            onChange={this.handlePasswordPhrase}
            placeholder="Password phrase. Do NOT forget to save this! Use >15 words to be safe."
          />
        </InputGroup>
        <br />
        <InputGroup>
          <Input
            value={this.state.privateKey}
            placeholder="Private key generated from password phrase"
          />
          <InputGroupButton>
            <CopyToClipboard text={this.state.privateKey}>
              <Button>
                <MDCopy />
              </Button>
            </CopyToClipboard>
          </InputGroupButton>
        </InputGroup>
      </div>
    );
  }
}
