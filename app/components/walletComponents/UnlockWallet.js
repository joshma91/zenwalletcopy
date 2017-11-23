import React from "react";
import {
  Alert,
  Form,
  FormText,
  FormGroup,
  Label,
  InputGroup,
  Input,
  InputGroupButton,
  Button,
  Col,
} from "reactstrap";

import FAEyeSlash from "react-icons/lib/fa/eye-slash";
import FAEye from "react-icons/lib/fa/eye";
import hdwallet from "../../lib/hdwallet";

// Unlock wallet enum
const UNLOCK_WALLET_TYPE = {
  IMPORT_WALLET: 0,
  HD_WALLET: 1,
  PASTE_PRIV_KEY: 2,
};

export default class UnlockWallet extends React.Component {
  constructor(props) {
    super(props);

    this.unlockHDWallet = this.unlockHDWallet.bind(this);
    this.loadWalletDat = this.loadWalletDat.bind(this);
    this.toggleShowPassword = this.toggleShowPassword.bind(this);
    this.unlockPrivateKeys = this.unlockPrivateKeys.bind(this);

    this.state = {
      showPassword: false,
      secretPhrase: ``,
      invalidPrivateKey: false,
      secretPhraseTooShort: false,

      // Style for input button
      inputFileStyle: {
        WebkitAppearance: `button`,
        cursor: `pointer`,
      },
    };
  }

  toggleShowPassword() {
    this.setState({
      showPassword: !this.state.showPassword,
    });
  }

  unlockPrivateKeys() {
    // Success = return 0
    const success = this.props.handleUnlockPrivateKeys() === 0;

    if (!success) {
      this.setState({
        invalidPrivateKey: true,
      });
    }
  }

  unlockHDWallet() {
    try {
      // Generate private keys from secret phrase
      const pk = hdwallet.phraseToHDWallet(this.state.secretPhrase);

      this.setState({
        secretPhraseTooShort: false,
      });

      // Set private key and unlock them (we know it'll work so no need to validate)
      this.props.setPrivateKeys(pk, true);
    } catch (err) {
      this.setState({
        secretPhraseTooShort: true,
      });
    }
  }

  loadWalletDat(e) {
    const reader = new FileReader();
    const file = e.target.files[0];

    // Read file callback function
    reader.onloadend = () => {
      // Get reader results in bytes
      const dataHexStr = reader.result;

      // Retrieve private keys from wallet.dat
      // Source: https://gist.github.com/moocowmoo/a715c80399bb202a65955771c465530c
      const re = /\x30\x81\xD3\x02\x01\x01\x04\x20(.{32})/gm;
      let privateKeys = dataHexStr.match(re);
      privateKeys = privateKeys.map((x) => {
        x = x.replace(`\x30\x81\xD3\x02\x01\x01\x04\x20`, ``);
        x = Buffer.from(x, `latin1`).toString(`hex`);
        return x;
      });

      // Set private key
      this.props.setPrivateKeys(privateKeys);

      // Unlock private key
      const success = this.props.handleUnlockPrivateKeys() === 0;

      if (!success) {
        this.setState({
          invalidPrivateKey: true,
        });
      }
    };

    // Read file
    reader.readAsBinaryString(file);
  }

  render() {
    if (this.props.unlockType === UNLOCK_WALLET_TYPE.IMPORT_WALLET) {
      return (
        <Form>
          <FormGroup row>
            <Col>
              {this.state.invalidPrivateKey ? (
                <Alert color="danger">
                  <strong>Error.</strong>&nbsp;Keys in files are corrupted
                </Alert>
              ) : (
                ``
              )}
              <Label
                for="walletDatFile"
                className="btn btn-block btn-secondary"
                style={this.state.inputFileStyle}
              >
                Select wallet.dat file
                <Input
                  style={{ display: `none` }}
                  type="file"
                  name="file"
                  id="walletDatFile"
                  onChange={this.loadWalletDat}
                />
              </Label>
              <FormText color="muted">
                For Windows, it should be in %APPDATA%/zen<br />
                For Mac/Linux, it should be in ~/.zen
              </FormText>
            </Col>
          </FormGroup>
        </Form>
      );
    } else if (this.props.unlockType === UNLOCK_WALLET_TYPE.PASTE_PRIV_KEY) {
      return (
        <div>
          {this.state.invalidPrivateKey ? (
            <Alert color="danger">
              <strong>Error.</strong>&nbsp;Invalid private key
            </Alert>
          ) : (
            ``
          )}
          <InputGroup>
            <InputGroupButton>
              <Button id={4} onClick={this.toggleShowPassword}>
                {this.state.showPassword ? <FAEye /> : <FAEyeSlash />}
              </Button>
            </InputGroupButton>
            <Input
              type={this.state.showPassword ? `text` : `password`}
              onChange={e => this.props.setPrivateKeys([e.target.value])} // Set it in a list so we can map over it later
              placeholder="Private key"
            />
          </InputGroup>
          <div style={{ paddingTop: `8px` }}>
            <Button color="secondary" className="btn-block" onClick={this.unlockPrivateKeys}>
              Unlock Private Key
            </Button>
          </div>
        </div>
      );
    } else if (this.props.unlockType === UNLOCK_WALLET_TYPE.HD_WALLET) {
      return (
        <div>
          <Alert color="warning">
            <strong>Warning.</strong>&nbsp;Make sure you have saved your secret phrase somewhere.
          </Alert>
          {this.state.secretPhraseTooShort ? (
            <Alert color="danger">
              <strong>Error.</strong>&nbsp;Secret phrase too short
            </Alert>
          ) : (
            ``
          )}
          <InputGroup>
            <InputGroupButton>
              <Button id={7} onClick={this.toggleShowPassword}>
                {this.state.showPassword ? <FAEye /> : <FAEyeSlash />}
              </Button>
            </InputGroupButton>
            <Input
              type={this.state.showPassword ? `text` : `password`}
              maxLength="64"
              onChange={e => this.setState({ secretPhrase: e.target.value })}
              placeholder="Secret phrase. e.g. cash cash cow moo money heros cardboard money bag late green"
            />
          </InputGroup>
          <div style={{ paddingTop: `8px` }}>
            <Button color="secondary" className="btn-block" onClick={this.unlockHDWallet}>
              Generate Wallet
            </Button>
          </div>
        </div>
      );
    }
  }
}
