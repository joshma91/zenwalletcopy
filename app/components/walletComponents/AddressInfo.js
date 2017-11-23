import React from "react";
import { Alert, CardBlock, Card, Row, Col } from "reactstrap";

import axios from "axios";
import zenwalletutils from "../../lib/utils";
import ReactTable from 'react-table'

// Throttled GET request to prevent unusable lag
const throttledAxiosGet = zenwalletutils.promiseDebounce(axios.get, 1000, 5);

export default class AddressInfo extends React.Component {
  constructor(props) {
    super(props);

    this.updateAddressInfo = this.updateAddressInfo.bind(this);
    this.updateAddressesInfo = this.updateAddressesInfo.bind(this);
    this.getAddressBlockExplorerURL = this.getAddressBlockExplorerURL.bind(this);

    this.state = {
      retrieveAddressError: false,
    };
  }

  componentDidMount() {
    // Run immediately
    this.updateAddressesInfo();

    // Update every 30 seconds
    this.interval = setInterval(this.updateAddressesInfo, 300000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  // Gets the blockchain explorer URL for an address
  getAddressBlockExplorerURL(address) {
    return zenwalletutils.urlAppend(this.props.settings.explorerURL, `address/`) + address;
  }

  // Updates a address info
  updateAddressInfo(address) {
    // GET request to URL
    let info_url = zenwalletutils.urlAppend(this.props.settings.insightAPI, `addr/`);
    info_url = zenwalletutils.urlAppend(info_url, `${address}?noTxList=1`);

    throttledAxiosGet(info_url)
      .then((response) => {
        const data = response.data;

        this.props.setPublicAddressesKeyValue(address, `confirmedBalance`, data.balance);
        this.props.setPublicAddressesKeyValue(
          address,
          `unconfirmedBalance`,
          data.unconfirmedBalance,
        );
        this.setState({
          retrieveAddressError: false,
        });
      })
      .catch((error) => {
        this.setState({
          retrieveAddressError: true,
        });
      });
  }

  // Updates all address info
  updateAddressesInfo() {
    // The key is the address
    // Value is the private key
    Object.keys(this.props.publicAddresses).forEach((key) => {
      if (key !== undefined) {
        this.updateAddressInfo(key);
      }
    });
  }

  render() {
    // Key is the address
    const addresses = [];
    let totalConfirmed = 0.0;
    let totalUnconfirmed = 0.0;
    Object.keys(this.props.publicAddresses).forEach((key) => {
      if (key !== undefined) {
        // Add to address
        addresses.push({
          address: key,
          privateKeyWIF: this.props.publicAddresses[key].privateKeyWIF,
          confirmedBalance: this.props.publicAddresses[key].confirmedBalance,
          unconfirmedBalance: this.props.publicAddresses[key].unconfirmedBalance,
        });

        const c_confirmed = Number(this.props.publicAddresses[key].confirmedBalance);
        const c_unconfirmed = Number(this.props.publicAddresses[key].unconfirmedBalance);
        if (!isNaN(c_confirmed)) {
          totalConfirmed += c_confirmed;
        }

        if (!isNaN(c_unconfirmed)) {
          totalUnconfirmed += c_unconfirmed;
        }
      }
    });

    const addressColumns = [
      {
        Header: `Address`,
        accessor: `address`,
        resizable: true,
        Cell: props => <a href={this.getAddressBlockExplorerURL(props.value)}>{props.value}</a>,
      },
      {
        Header: `Confirmed`,
        accessor: `confirmedBalance`,
        Cell: props => <span className="number">{props.value}</span>,
      },
      {
        Header: `Unconfirmed`,
        accessor: `unconfirmedBalance`,
        Cell: props => <span className="number">{props.value}</span>,
      },
    ];

    return (
      <Row>
        <Col>
          <Card>
            <CardBlock>
              {this.state.retrieveAddressError ? (
                <Alert color="danger">
                  Error connecting to the Insight API. Double check the Insight API supplied in
                  settings.
                </Alert>
              ) : (
                <Alert color="warning">
                  The balance displayed here is dependent on the insight node.<br />Automatically
                  updates every 5 minutes. Alternatively, you can{` `}
                  <a href="#" onClick={() => this.updateAddressesInfo()}>
                    forcefully refresh
                  </a>
                  {` `}
                  them.
                </Alert>
              )}
            </CardBlock>
          </Card>
          <Card>
            <CardBlock>
              <ReactTable
                columns={[
                  {
                    Header: `Total Confirmed`,
                    accessor: `totalConfirmed`,
                    Cell: props => <span className="number">{props.value}</span>,
                  },
                  {
                    Header: `Total Unconfirmed`,
                    accessor: `totalUnconfirmed`,
                    Cell: props => <span className="number">{props.value}</span>,
                  },
                ]}
                data={[
                  {
                    totalConfirmed,
                    totalUnconfirmed,
                  },
                ]}
                showPagination={false}
                minRows={1}
              />
            </CardBlock>
          </Card>
          <Card>
            <CardBlock>
              <ReactTable
                data={addresses}
                columns={addressColumns}
                minRows={addresses.length > 20 ? 20 : addresses.length}
                showPagination={addresses.length > 20}
              />
            </CardBlock>
          </Card>
        </Col>
      </Row>
    );
  }
}
