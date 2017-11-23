import React from "react";
import classnames from "classnames";
import {
  CardBlock,
  Button,
  TabContent,
  TabPane,
  Nav,
  NavItem,
  NavLink,
  Card,
  Row,
  Col,
} from "reactstrap";

import pjson from "../../package.json";
import AddressInfo from "./AddressInfo";
import SendZEN from "./SendZen";
import PrintableKeys from "./PrintableKeys";

export default class WalletTabs extends React.Component {
  constructor(props) {
    super(props);

    this.toggleTabs = this.toggleTabs.bind(this);
    this.savePrivateKeys = this.savePrivateKeys.bind(this);
    this.state = {
      activeTab: `1`,
    };
  }

  toggleTabs(tab) {
    if (this.state.activeTab !== tab) {
      this.setState({
        activeTab: tab,
      });
    }
  }

  savePrivateKeys() {
    // ISO 8601
    let now = new Date();
    now = `${now.toISOString().split(`.`)[0]}Z`;

    let fileStr = `# Wallet dump created by myzenwallet ${pjson.version}\n`;
    fileStr += `# Created on ${now}\n\n\n`;

    Object.keys(this.props.publicAddresses).forEach((key) => {
      fileStr += this.props.publicAddresses[key].privateKeyWIF;
      fileStr += ` ${now} ` + `label=` + ` ` + `# addr=${key}`;
      fileStr += `\n`;
    });

    const pkBlob = new Blob([fileStr], { type: `text/plain;charset=utf-8` });
    FileSaver.saveAs(pkBlob, `${now}_myzenwallet_private_keys.txt`);
  }

  render() {
    return (
      <div>
        <Nav tabs>
          <NavItem>
            <NavLink
              className={classnames({ active: this.state.activeTab === `1` })}
              onClick={() => {
                this.toggleTabs(`1`);
              }}
            >
              Info
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              className={classnames({ active: this.state.activeTab === `2` })}
              onClick={() => {
                this.toggleTabs(`2`);
              }}
            >
              Send ZEN
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              className={classnames({ active: this.state.activeTab === `3` })}
              onClick={() => {
                this.toggleTabs(`3`);
              }}
            >
              Export
            </NavLink>
          </NavItem>
        </Nav>
        <TabContent activeTab={this.state.activeTab}>
          <TabPane tabId="1">
            <AddressInfo
              publicAddresses={this.props.publicAddresses}
              settings={this.props.settings}
              setPublicAddressesKeyValue={this.props.setPublicAddressesKeyValue}
            />
          </TabPane>
          <TabPane tabId="2">
            <SendZEN settings={this.props.settings} publicAddresses={this.props.publicAddresses} />
          </TabPane>
          <TabPane tabId="3">
            <Row>
              <Col>
                <Card>
                  <CardBlock>
                    <PrintableKeys publicAddresses={this.props.publicAddresses} />
                  </CardBlock>
                  <CardBlock>
                    <h3>Private Key Dump</h3>
                    <Button color="secondary" className="btn-block" onClick={this.savePrivateKeys}>
                      Download Private Keys
                    </Button>
                  </CardBlock>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </TabContent>
      </div>
    );
  }
}
