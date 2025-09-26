import { useState } from "react";
import Modal from "react-bootstrap/Modal";
import toast from "react-hot-toast";
import FormInput from "../components/form/FormInput";
import { SVGICON } from "../constants/iconsList";
import { validateClarificationText, countWords } from "../utils/wordCountUtils";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate clarification text using utility function
    const validation:any = validateClarificationText(clarification);
    if (!validation.isValid) {
      toast.dismiss();
      toast.error(validation.message);
      return;
    }

    // If validation passes, show success message
    toast.dismiss();
    toast.success("Clarification submitted successfully");
    handleClose();
    setClarification("");
  };

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
        <form onSubmit={handleSubmit}>
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
            <div className="mt-2">
              <small className={`text-muted ${countWords(clarification) > 200 ? 'text-danger' : ''}`}>
                Word count: {countWords(clarification)}/200
              </small>
            </div>
          </div>
          <div className="d-flex align-items-center justify-content-end gap-3">
            <button type="submit" className="_btn primary">
              Add Clarification
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ClarificationModal;
