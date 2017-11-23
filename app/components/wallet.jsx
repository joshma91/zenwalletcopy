import {
  Alert,
  Form,
  FormText,
  ButtonGroup,
  UncontrolledAlert,
  Tooltip,
  CardBlock,
  CardFooter,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ListGroup,
  ListGroupItem,
  Badge,
  Progress,
  FormGroup,
  Label,
  Container,
  Jumbotron,
  TabContent,
  InputGroup,
  Input,
  InputGroupAddon,
  InputGroupButton,
  Table,
  TabPane,
  Nav,
  NavItem,
  NavLink,
  Card,
  CardSubtitle,
  Button,
  CardTitle,
  CardText,
  Row,
  Col,
} from "reactstrap";

import axios from "axios";
import React from "react";
import QRCode from "qrcode.react";
import CopyToClipboard from "react-copy-to-clipboard";
import ReactTable from "react-table";
import zencashjs from "zencashjs";
import zenwalletutils from "../lib/utils";
import hdwallet from "../lib/hdwallet";
import FileSaver from "file-saver";

import MDRefresh from "react-icons/lib/md/refresh";
import MDSettings from "react-icons/lib/md/settings";
import FARepeat from "react-icons/lib/fa/repeat";
import UnlockWallet from "./walletComponents/UnlockWallet";
import ToolTipButton from "./walletComponents/ToolTipButton";
import WalletSettings from "./walletComponents/WalletSettings";
import WalletTabs from "./walletComponents/WalletTabs";
import WalletGenerator from './walletComponents/WalletGenerator'

// Unlock wallet enum
const UNLOCK_WALLET_TYPE = {
  IMPORT_WALLET: 0,
  HD_WALLET: 1,
  PASTE_PRIV_KEY: 2,
};

// Components

export default class ZWallet extends React.Component {
  constructor(props) {
    super(props);

    this.resetKeys = this.resetKeys.bind(this);
    this.handleUnlockPrivateKeys = this.handleUnlockPrivateKeys.bind(this);
    this.setPrivateKeys = this.setPrivateKeys.bind(this);
    this.setInsightAPI = this.setInsightAPI.bind(this);
    this.setUnlockType = this.setUnlockType.bind(this);
    this.setPublicAddressesKeyValue = this.setPublicAddressesKeyValue.bind(this);
    this.toggleUseTestNet = this.toggleUseTestNet.bind(this);
    this.toggleCompressPubKey = this.toggleCompressPubKey.bind(this);
    this.toggleShowSettings = this.toggleShowSettings.bind(this);
    this.toggleShowWalletGen = this.toggleShowWalletGen.bind(this);

    this.state = {
      privateKeys: ``,
      publicAddresses: null, // Public address will be {address: {privateKey: '', transactionURL: '', privateKeyWIF: ''}
      settings: {
        showSettings: false,
        showWalletGen: false,
        compressPubKey: true,
        insightAPI: `https://explorer.zensystem.io/insight-api-zen/`,
        explorerURL: `https://explorer.zensystem.io/`,
        useTestNet: false,
        unlockType: UNLOCK_WALLET_TYPE.HD_WALLET,
      },
    };
  }

  setUnlockType(t) {
    const _settings = this.state.settings;
    _settings.unlockType = t;

    this.setState({
      _settings,
    });
  }

  resetKeys() {
    this.setState({
      privateKeys: ``,
      publicAddresses: null,
    });
  }

  // Only used for bip32 gen wallet because
  // of the async nature
  setPrivateKeys(pk, handleUnlockingKeys) {
    if (handleUnlockingKeys === undefined) {
      handleUnlockingKeys = false;
    }
    this.setState(
      {
        privateKeys: pk,
      },
      handleUnlockingKeys ? this.handleUnlockPrivateKeys : undefined,
    );
  }

  setPublicAddresses(pa) {
    this.setState({
      publicAddresses: pa,
    });
  }

  setPublicAddressesKeyValue(address, key, value) {
    const newPublicAddresses = this.state.publicAddresses;
    newPublicAddresses[address][key] = value;

    this.setState({
      publicAddresses: newPublicAddresses,
    });
  }

  setInsightAPI(uri) {
    const _settings = this.state.settings;
    _settings.insightAPI = uri;

    this.setState({
      _settings,
    });
  }

  handleUnlockPrivateKeys() {
    if (this.state.privateKeys.length === 0) {
      return -2;
    }

    try {
      const publicAddresses = {};

      function _privKeyToAddr(pk, compressPubKey, useTestNet) {
        // If not 64 length, probs WIF format
        if (pk.length !== 64) {
          pk = zencashjs.address.WIFToPrivKey(pk);
        }

        // Convert public key to public address
        const pubKey = zencashjs.address.privKeyToPubKey(pk, compressPubKey);

        // Testnet or nah
        const pubKeyHash = useTestNet
          ? zencashjs.config.testnet.pubKeyHash
          : zencashjs.config.mainnet.pubKeyHash;
        const publicAddr = zencashjs.address.pubKeyToAddr(pubKey, pubKeyHash);

        return publicAddr;
      }

      for (let i = 0; i < this.state.privateKeys.length; i++) {
        const pubKeyHash = this.state.settings.useTestNet
          ? zencashjs.config.testnet.wif
          : zencashjs.config.mainnet.wif;

        var c_pk_wif;
        let c_pk = this.state.privateKeys[i];

        // If not 64 length, probs WIF format
        if (c_pk.length !== 64) {
          c_pk_wif = c_pk;
          c_pk = zencashjs.address.WIFToPrivKey(c_pk);
        } else {
          c_pk_wif = zencashjs.address.privKeyToWIF(c_pk);
        }

        var c_pk_wif = zencashjs.address.privKeyToWIF(c_pk, true, pubKeyHash);
        const c_addr = _privKeyToAddr(
          c_pk,
          this.state.settings.compressPubKey,
          this.state.settings.useTestNet,
        );

        publicAddresses[c_addr] = {
          privateKey: c_pk,
          privateKeyWIF: c_pk_wif,
          confirmedBalance: `loading...`,
          unconfirmedBalance: `loading...`,
        };
      }

      // Set public address
      this.setPublicAddresses(publicAddresses);

      // Return success
      return 0;
    } catch (err) {
      this.setPublicAddresses(null);
      return -1;
    }
  }

  toggleCompressPubKey(b) {
    const _settings = this.state.settings;
    _settings.compressPubKey = !_settings.compressPubKey;

    this.setState({
      _settings,
    });
  }

  toggleUseTestNet() {
    const _settings = this.state.settings;
    _settings.useTestNet = !_settings.useTestNet;

    if (_settings.useTestNet) {
      _settings.insightAPI = `https://aayanl.tech/insight-api-zen/`;
      _settings.explorerURL = `https://aayanl.tech/`;
    } else {
      _settings.insightAPI = `https://explorer.zensystem.io/insight-api-zen/`;
      _settings.explorerURL = `https://explorer.zensystem.io/`;
    }

    this.setState({
      settings: _settings,
    });
  }

  toggleShowSettings() {
    const _settings = this.state.settings;
    _settings.showSettings = !_settings.showSettings;

    this.setState({
      settings: _settings,
    });
  }

  toggleShowWalletGen() {
    const _settings = this.state.settings;
    _settings.showWalletGen = !_settings.showWalletGen;

    this.setState({
      settings: _settings,
    });
  }

  render() {
    return (
      <Container>
        <Row>
          <Col>
            <h1 className="display-6">
              ZenCash Wallet&nbsp;
              <ToolTipButton
                onClick={this.toggleShowSettings}
                id={1}
                buttonText={<MDSettings />}
                tooltipText="settings"
              />&nbsp;
              <ToolTipButton
                disabled={this.state.publicAddresses === null}
                onClick={this.resetKeys}
                id={2}
                buttonText={<FARepeat />}
                tooltipText="reset wallet"
              />
            </h1>
            <WalletSettings
              setUnlockType={this.setUnlockType}
              toggleShowSettings={this.toggleShowSettings}
              toggleCompressPubKey={this.toggleCompressPubKey}
              toggleShowWalletGen={this.toggleShowWalletGen}
              toggleUseTestNet={this.toggleUseTestNet}
              setInsightAPI={this.setInsightAPI}
              settings={this.state.settings}
              publicAddresses={this.state.publicAddresses}
            />
            <br />
          </Col>
        </Row>
        <Row>
          <Col>
            {this.state.publicAddresses === null ? (
              <UnlockWallet
                handleUnlockPrivateKeys={this.handleUnlockPrivateKeys}
                setPrivateKeys={this.setPrivateKeys}
                unlockType={this.state.settings.unlockType}
              />
            ) : (
              <WalletTabs
                publicAddresses={this.state.publicAddresses}
                settings={this.state.settings}
                setPublicAddressesKeyValue={this.setPublicAddressesKeyValue}
                privateKeys={this.state.privateKeys}
              />
            )}
          </Col>
        </Row>
        <Row>
          <Col>
            {this.state.settings.showWalletGen ? (
              <div>
                <br />
                <hr />
                <WalletGenerator settings={this.state.settings} />
              </div>
            ) : null}
          </Col>
        </Row>
      </Container>
    );
  }
}
