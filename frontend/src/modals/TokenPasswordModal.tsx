import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

interface TokenPasswordModalProps {
  show: boolean;
  onClose: () => void;
  memberType: "member_officer" | "presiding_officer";
  onSuccess: () => void;
}

const TokenPasswordModal: React.FC<TokenPasswordModalProps> = ({
  show,
  onClose,
  memberType,
  onSuccess,
}) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    const correctPassword =
      memberType === "presiding_officer" ? "123456" : "12345678";

    if (password === correctPassword) {
      console.log("✅ Token password correct for", memberType);
      setError("");
      onClose();
      onSuccess();
    } else {
      setError("Incorrect token password. Please try again.");
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Enter Token Password</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group>
          <Form.Label>Token Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Enter token password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Group>
        {error && <p className="text-danger mt-2">{error}</p>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleConfirm}>
          Confirm
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default TokenPasswordModal;
