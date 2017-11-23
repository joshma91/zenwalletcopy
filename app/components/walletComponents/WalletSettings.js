import React from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Label,
  InputGroup,
  Input,
  InputGroupAddon,
  Row,
  Col,
} from "reactstrap";

import WalletSelectUnlockType from "./WalletSelectUnlockType";

const WalletSettings = ({
  settings,
  toggleShowSettings,
  setUnlockType,
  toggleCompressPubKey,
  toggleShowWalletGen,
  toggleUseTestNet,
  setInsightAPI,
  publicAddresses,
  toggleModalSettings,
}) => (
  <Modal isOpen={settings.showSettings} toggle={toggleModalSettings}>
    <ModalHeader toggle={toggleShowSettings}>ZenCash Wallet Settings</ModalHeader>
    <ModalBody>
      <WalletSelectUnlockType setUnlockType={setUnlockType} unlockType={settings.unlockType} />
    </ModalBody>
    <ModalBody>
      <InputGroup>
        <InputGroupAddon>Insight API</InputGroupAddon>
        <Input value={settings.insightAPI} onChange={e => setInsightAPI(e.target.value)} />
      </InputGroup>
      <br />
      <Row>
        <Col sm="6">
          <Label check>
            <Input
              disabled={!(publicAddresses === null)}
              defaultChecked={settings.compressPubKey}
              type="checkbox"
              onChange={toggleCompressPubKey}
            />
            {` `}
            Compress Public Key
          </Label>
        </Col>
        <Col sm="6">
          <Label check>
            <Input
              defaultChecked={settings.showWalletGen}
              type="checkbox"
              onChange={toggleShowWalletGen}
            />
            {` `}
            Show Address Generator
          </Label>
        </Col>
      </Row>
    </ModalBody>
    <ModalFooter>
      <Label>
        <Input
          disabled={!(publicAddresses === null)}
          defaultChecked={settings.useTestNet}
          type="checkbox"
          onChange={toggleUseTestNet}
        />
        {` `}
        testnet
      </Label>
    </ModalFooter>
  </Modal>
);

export default WalletSettings;
