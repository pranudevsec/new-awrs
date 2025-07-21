import React from "react";
import { Modal, Button } from "react-bootstrap";

interface DisclaimerModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message?: string;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ show, onClose, onConfirm,message }) => {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Disclaimer</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
            {message || "Please read the following disclaimer carefully before proceeding."}
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          I Acknowledge
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DisclaimerModal;