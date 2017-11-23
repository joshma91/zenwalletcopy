import React from 'react';
import { Alert, Form, FormText, ButtonGroup, UncontrolledAlert, Tooltip, CardBlock, CardFooter, Modal, ModalHeader, ModalBody, ModalFooter, ListGroup, ListGroupItem, Badge, Progress, FormGroup, Label, Container, Jumbotron, TabContent, InputGroup, Input, InputGroupAddon, InputGroupButton, Table, TabPane, Nav, NavItem, NavLink, Card, CardSubtitle, Button, CardTitle, CardText, Row, Col } from 'reactstrap';


export default class ToolTipButton extends React.Component {
  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.state = {
      tooltipOpen: false,
    };
  }

  toggle() {
    this.setState({
      tooltipOpen: !this.state.tooltipOpen,
    });
  }

  render() {
    return (
      <span>
        <Button
          disabled={this.props.disabled}
          onClick={this.props.onClick}
          className="mr-1"
          color="secondary"
          id={`Tooltip-${this.props.id}`}
        >
          {this.props.buttonText}
        </Button>
        <Tooltip
          placement="top"
          isOpen={this.state.tooltipOpen}
          target={`Tooltip-${this.props.id}`}
          toggle={this.toggle}
        >
          {this.props.tooltipText}
        </Tooltip>
      </span>
    );
  }
}
