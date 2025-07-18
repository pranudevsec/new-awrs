import { useState } from "react";
import Modal from "react-bootstrap/Modal";
import FormInput from "../components/form/FormInput";
import { SVGICON } from "../constants/iconsList";

interface ClarificationModalProps {
  show: boolean;
  handleClose: () => void;
}

const ClarificationModal: React.FC<ClarificationModalProps> = ({
  show,
  handleClose,
}) => {
  // States
  const [clarification, setClarification] = useState("")

  return (
    <Modal
      centered
      show={show}
      onHide={handleClose}
      dialogClassName="clarification-modal"
    >
      <div className="modal-header border-0 d-flex align-items-center justify-content-between">
        <h4 className="font-lexend fw-6">Add clarification</h4>
        <button className="close-btn bg-transparent border-0" onClick={handleClose}>
          {SVGICON.app.close}
        </button>
      </div>
      <div className="modal-body bg-white rounded-3 pt-0">
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="mb-4">
            <FormInput
              name="cyclePeriod"
              placeholder="Maximum 200 Words...."
              type="text"
              as="textarea"
              rows={8}
              value={clarification}
              onChange={(e) => setClarification(e.target.value)}
            />
          </div>
          <div className="d-flex align-items-center justify-content-end gap-3">
            <button type="submit" className="_btn primary">
              Add
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ClarificationModal;
