import React from "react";
import {
  Row,
  Input,
  QRCode,
  Col,
} from "reactstrap";

export default class ZPrintableKeys extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedPublicAddress: ``,
      selectedPrivateKey: ``,
    };

    this.handleUpdateSelectedAddress = this.handleUpdateSelectedAddress.bind(this);
  }

  handleUpdateSelectedAddress(e) {
    const selectedPublicAddress = e.target.value;
    const selectedPrivateKey =
      selectedPublicAddress === ``
        ? ``
        : this.props.publicAddresses[selectedPublicAddress].privateKeyWIF;

    this.setState({
      selectedPublicAddress,
      selectedPrivateKey,
    });

    console.log(selectedPrivateKey);
  }

  render() {
    const sendAddresses = [];
    Object.keys(this.props.publicAddresses).forEach((key) => {
      if (key !== undefined) {
        sendAddresses.push(<option value={key}>
              [{this.props.publicAddresses[key].confirmedBalance}] - {key}
                           </option>);
      }
    });

    return (
      <div>
        <h3>Printable Wallet</h3>
        <Input type="select" onChange={this.handleUpdateSelectedAddress}>
          <option value="" />
          {sendAddresses}
        </Input>
        <div>
          {this.state.selectedPublicAddress === `` ? null : (
            <Row style={{ textAlign: `center`, paddingTop: `75px`, paddingBottom: `25px` }}>
              <Col>
                <QRCode value={this.state.selectedPublicAddress} />
                <br />
                {this.state.selectedPublicAddress}
              </Col>

              <Col>
                <QRCode value={this.state.selectedPrivateKey} />
                <br />
                {this.state.selectedPrivateKey}
              </Col>
            </Row>
          )}
        </div>
      </div>
    );
  }
}
