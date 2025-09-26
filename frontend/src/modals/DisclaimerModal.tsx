import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import toast from "react-hot-toast";

interface DisclaimerModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message?: string;
  pendingDecision?: any;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({
  show,
  onClose,
  onConfirm,
  message,
  pendingDecision,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [password, setPassword] = useState("");

  // Reset modal state whenever it's closed
  useEffect(() => {
    if (!show) {
      setStep(1);
      setPassword("");
    }
  }, [show]);

  const handleAcknowledge = () => {
    if(pendingDecision){
      setStep(2); 
    }else{
      onConfirm();
    }
  };

  const handleAuthConfirm = () => {
    const correctPassword =
      pendingDecision?.member.member_type === "presiding_officer"
        ? "12345678"
        : pendingDecision?.member.member_type === "member_officer"
        ? "123456"
        : "";

    if (password === correctPassword) {
      onConfirm();
    } else {
      toast.error("Wrong password");
      onClose();
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      {step === 1 ? (
        <>
          <Modal.Header closeButton>
            <Modal.Title>Disclaimer</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              {message ??
                "Please read the following disclaimer carefully before proceeding."}
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAcknowledge}>
              I Acknowledge
            </Button>
          </Modal.Footer>
        </>
      ) : (
        <>
          <Modal.Header closeButton>
            <Modal.Title>Token Authentication</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Enter Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter token password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleAuthConfirm}>
              Confirm
            </Button>
          </Modal.Footer>
        </>
      )}
    </Modal>
  );
};

export default DisclaimerModal;
