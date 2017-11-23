import React from "react";
import { Alert, Button, CardFooter, Progress, Card, CardBlock, FormGroup, Label, InputGroup, Input, InputGroupAddon, Row, Col } from "reactstrap";
import axios from "axios";
import zencashjs from "zencashjs";
import zenwalletutils from "../../lib/utils";

export default class ZSendZEN extends React.Component {
  constructor(props) {
    super(props);

    this.setProgressValue = this.setProgressValue.bind(this);
    this.setSendErrorMessage = this.setSendErrorMessage.bind(this);
    this.handleUpdateSelectedAddress = this.handleUpdateSelectedAddress.bind(this);
    this.handleUpdateRecipientAddress = this.handleUpdateRecipientAddress.bind(this);
    this.handleUpdateAmount = this.handleUpdateAmount.bind(this);
    this.handleCheckChanged = this.handleCheckChanged.bind(this);
    this.handleUpdateFee = this.handleUpdateFee.bind(this);
    this.handleSendZEN = this.handleSendZEN.bind(this);

    this.state = {
      selectedAddress: ``, // which address did we select
      recipientAddress: ``,
      fee: ``,
      amount: ``,
      sentTxid: ``, // Whats the send txid
      sendProgress: 0, // Progress bar, 100 to indicate complete
      sendErrorMessage: ``,
      confirmSend: false,
    };
  }

  setSendErrorMessage(msg) {
    this.setState({
      sendErrorMessage: msg,
    });
  }

  setProgressValue(v) {
    this.setState({
      sendProgress: v,
    });
  }

  handleCheckChanged(e) {
    this.setState({
      confirmSend: e.target.checked,
    });
  }

  handleUpdateAmount(e) {
    this.setState({
      amount: e.target.value,
    });
  }

  handleUpdateFee(e) {
    this.setState({
      fee: e.target.value,
    });
  }

  handleUpdateRecipientAddress(e) {
    this.setState({
      recipientAddress: e.target.value,
    });
  }

  handleUpdateSelectedAddress(e) {
    this.setState({
      selectedAddress: e.target.value,
    });
  }

  handleSendZEN() {
    const value = this.state.amount;
    const fee = this.state.fee;
    const recipientAddress = this.state.recipientAddress;
    const senderAddress = this.state.selectedAddress;

    // Convert how much we wanna send
    // to satoshis
    const satoshisToSend = Math.round(value * 100000000);
    const satoshisfeesToSend = Math.round(fee * 100000000);

    // Reset zen send progress and error message
    this.setProgressValue(1);
    this.setSendErrorMessage(``);

    // Error strings
    let errString = ``;

    // Validation
    if (senderAddress === ``) {
      errString += `\`From Address\` field can't be empty.;`;
    }

    if (recipientAddress.length !== 35) {
      errString += `Invalid address. Only transparent addresses are supported at this point in time.;`;
    }

    if (typeof parseInt(value) !== `number` || value === ``) {
      errString += `Invalid amount.;`;
    }

    // Can't send 0 satoshis
    if (satoshisToSend <= 0) {
      errString += `Amount must be greater than 0.;`;
    }

    if (typeof parseInt(fee) !== `number` || fee === ``) {
      errString += `Invalid fee.;`;
    }

    if (errString !== ``) {
      this.setSendErrorMessage(errString);
      this.setProgressValue(0);
      return;
    }

    // Private key
    const senderPrivateKey = this.props.publicAddresses[senderAddress].privateKey;

    // Get previous transactions
    const prevTxURL = `${zenwalletutils.urlAppend(this.props.settings.insightAPI, `addr/`) +
      senderAddress}/utxo`;
    const infoURL = zenwalletutils.urlAppend(this.props.settings.insightAPI, `status?q=getInfo`);
    const sendRawTxURL = zenwalletutils.urlAppend(this.props.settings.insightAPI, `tx/send`);

    // Building our transaction TXOBJ
    // How many satoshis do we have so far
    let satoshisSoFar = 0;
    let history = [];
    let recipients = [{ address: recipientAddress, satoshis: satoshisToSend }];

    // Get transactions and info
    axios
      .get(prevTxURL)
      .then((tx_resp) => {
        this.setProgressValue(25);

        const tx_data = tx_resp.data;

        axios.get(infoURL).then((info_resp) => {
          this.setProgressValue(50);
          const info_data = info_resp.data;

          const blockHeight = info_data.info.blocks - 300;
          const blockHashURL =
            zenwalletutils.urlAppend(this.props.settings.insightAPI, `block-index/`) + blockHeight;

          // Get block hash
          axios.get(blockHashURL).then((response_bhash) => {
            this.setProgressValue(75);

            const blockHash = response_bhash.data.blockHash;

            // Iterate through each utxo
            // append it to history
            for (var i = 0; i < tx_data.length; i++) {
              if (tx_data[i].confirmations == 0) {
                continue;
              }

              history = history.concat({
                txid: tx_data[i].txid,
                vout: tx_data[i].vout,
                scriptPubKey: tx_data[i].scriptPubKey,
              });

              // How many satoshis do we have so far
              satoshisSoFar += tx_data[i].satoshis;
              if (satoshisSoFar >= satoshisToSend + satoshisfeesToSend) {
                break;
              }
            }

            // If we don't have enough address
            // fail and tell user
            if (satoshisSoFar < satoshisToSend + satoshisfeesToSend) {
              this.setSendErrorMessage(`Not enough confirmed ZEN in account to perform transaction`);
              this.setProgressValue(0);
            }

            // If we don't have exact amount
            // Refund remaining to current address
            if (satoshisSoFar !== satoshisToSend + satoshisfeesToSend) {
              const refundSatoshis = satoshisSoFar - satoshisToSend - satoshisfeesToSend;
              recipients = recipients.concat({
                address: senderAddress,
                satoshis: refundSatoshis,
              });
            }

            // Create transaction
            let txObj = zencashjs.transaction.createRawTx(
              history,
              recipients,
              blockHeight,
              blockHash,
            );

            // Sign each history transcation
            for (var i = 0; i < history.length; i++) {
              txObj = zencashjs.transaction.signTx(
                txObj,
                i,
                senderPrivateKey,
                this.props.settings.compressPubKey,
              );
            }

            // Convert it to hex string
            const txHexString = zencashjs.transaction.serializeTx(txObj);

            axios
              .post(sendRawTxURL, { rawtx: txHexString })
              .then((sendtx_resp) => {
                this.setState({
                  sendProgress: 100,
                  sentTxid: sendtx_resp.data.txid,
                });
              })
              .catch((error) => {
                this.setSendErrorMessage(`${error}`);
                this.setProgressValue(0);
              });
          });
        });
      })
      .catch((error) => {
        this.setSendErrorMessage(error);
        this.setProgressValue(0);
      });
  }

  render() {
    // If send was successful
    let zenTxLink;
    if (this.state.sendProgress === 100) {
      const zentx =
        zenwalletutils.urlAppend(this.props.settings.explorerURL, `tx/`) + this.state.sentTxid;
      zenTxLink = (
        <Alert color="success">
          <strong>ZEN successfully sent!</strong>
          {` `}
          <a href={zentx}>Click here to view your transaction</a>
        </Alert>
      );
    } else if (this.state.sendErrorMessage !== ``) {
      // Else show error why
      zenTxLink = this.state.sendErrorMessage.split(`;`).map((s) => {
        if (s !== ``) {
          return (
            <Alert color="danger">
              <strong>Error.</strong> {s}
            </Alert>
          );
        }
      });
    }

    // Send addresses
    // Key is the address btw
    const sendAddresses = [];
    Object.keys(this.props.publicAddresses).forEach((key) => {
      if (key !== undefined) {
        sendAddresses.push(<option value={key}>
            [{this.props.publicAddresses[key].confirmedBalance}] - {key}
                           </option>);
      }
    });

    return (
      <Row>
        <Col>
          <Card>
            <CardBlock>
              <Alert color="danger">
                ALWAYS VALIDATE YOUR DESINATION ADDRESS BY SENDING SMALL AMOUNTS OF ZEN FIRST
              </Alert>
              <InputGroup>
                <InputGroupAddon>From Address</InputGroupAddon>
                <Input type="select" onChange={this.handleUpdateSelectedAddress}>
                  <option value="" />
                  {sendAddresses}
                </Input>
              </InputGroup>
              <InputGroup>
                <InputGroupAddon>To Address</InputGroupAddon>
                <Input
                  onChange={this.handleUpdateRecipientAddress}
                  placeholder="e.g znSDvF9nA5VCdse5HbEKmsoNbjCbsEA3VAH"
                />
              </InputGroup>
              <InputGroup>
                <InputGroupAddon>Amount</InputGroupAddon>
                <Input onChange={this.handleUpdateAmount} placeholder="e.g 42" />
              </InputGroup>
              <InputGroup>
                <InputGroupAddon>Fee</InputGroupAddon>
                <Input onChange={this.handleUpdateFee} placeholder="e.g 0.001" />
              </InputGroup>
              <br />
              <FormGroup check>
                <Label check>
                  <Input onChange={this.handleCheckChanged} type="checkbox" /> Yes, I would like to
                  send these ZEN
                </Label>
              </FormGroup>
              <br />
              <Button
                color="warning"
                className="btn-block"
                disabled={
                  !this.state.confirmSend ||
                  (this.state.sendProgress > 0 && this.state.sendProgress < 100)
                }
                onClick={this.handleSendZEN}
              >
                Send
              </Button>
            </CardBlock>
            <CardFooter>
              {zenTxLink}
              <Progress value={this.state.sendProgress} />
            </CardFooter>
          </Card>
        </Col>
      </Row>
    );
  }
}
