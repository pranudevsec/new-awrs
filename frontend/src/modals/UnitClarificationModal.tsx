import Modal from "react-bootstrap/Modal";
import FormInput from "../components/form/FormInput";
import { SVGICON } from "../constants/iconsList";

interface ClarificationModalProps {
  show: boolean;
  handleClose: () => void;
}

const UnitClarificationModal: React.FC<ClarificationModalProps> = ({
  show,
  handleClose,
}) => {
  return (
    <Modal
      centered
      show={show}
      onHide={handleClose}
      dialogClassName="clarification-modal"
    >
      <div className="modal-header border-0 d-flex align-items-center justify-content-between">
        <h4 className="font-lexend fw-6">Create reviewers comment</h4>
        <button className="close-btn bg-transparent border-0" onClick={handleClose}>
          {SVGICON.app.close}
        </button>
      </div>
      <div className="modal-body bg-white rounded-3 pt-0">
        <form>
          <div className="mb-4">
            <FormInput
              name="cyclePeriod"
              placeholder="Maximum 200 Words...."
              type="text"
              as="textarea"
              rows={4}
              value=""
            />
          </div>
          <div className="d-flex align-items-center justify-content-end gap-3">
            <button type="submit" className="_btn primary">
              Submit
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default UnitClarificationModal;
