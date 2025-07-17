import { useState, type ChangeEvent } from "react";
import Modal from "react-bootstrap/Modal";
import toast from "react-hot-toast";
import FormInput from "../components/form/FormInput";
import { SVGICON } from "../constants/iconsList";
import { updateClarification } from "../reduxToolkit/services/clarification/clarificationService";
import { useAppDispatch } from "../reduxToolkit/hooks";

interface ClarificationModalProps {
  show: boolean;
  handleClose: () => void;
  clarificationId: number;
  isRefreshData: boolean;
  setIsRefreshData: React.Dispatch<React.SetStateAction<boolean>>;
}

const GiveClarificationModal: React.FC<ClarificationModalProps> = ({
  show,
  handleClose,
  clarificationId,
  setIsRefreshData,
  isRefreshData
}) => {
  const dispatch = useAppDispatch();

  // States
  const [clarification, setClarification] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      e.target.value = "";
    } else {
      setFile(selectedFile ?? null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clarification.trim()) {
      toast.error("Please enter clarification");
      return;
    }

    await dispatch(
      updateClarification({
        id: clarificationId,
        clarification,
        clarification_doc: file ?? undefined,
      })
    );

    setIsRefreshData(!isRefreshData);
    handleClose();
    setClarification("");
    setFile(null);
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
            <label htmlFor="clarification_doc" className="form-label fw-5 mb-2">
              Please upload a supporting document (Max: 5MB)
            </label>
            <input
              type="file"
              className="form-control"
              name="clarification_doc"
              id="clarification_doc"
              autoComplete="off"
              onChange={handleFileChange}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="clarification" className="form-label fw-5 mb-2">
              Enter your clarification (max 200 words)
            </label>
            <FormInput
              name="clarification"
              placeholder="Type here...."
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

export default GiveClarificationModal;
