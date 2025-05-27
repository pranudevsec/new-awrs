import Modal from "react-bootstrap/Modal";
import { SVGICON } from "../constants/iconsList";
import { Link } from "react-router-dom";

interface ClarificationModalProps {
    show: boolean;
    handleClose: () => void;
}

const ReqClarificationModal: React.FC<ClarificationModalProps> = ({
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
                <h4 className="font-lexend fw-6">View requested clarification</h4>
                <button className="bg-transparent border-0" onClick={handleClose}>
                    {SVGICON.app.close}
                </button>
            </div>
            <div className="modal-body bg-white rounded-3 pt-0">
                <p className="sign-up-text mt-4">
                    Clarification document:- <Link target="_blank" to="https://file-examples.com/storage/fe107381506834ce5ab4767/2017/10/file-sample_150kB.pdf" className="fw-6">https://file-examples.com/storage/fe107381506834ce5ab4767/2017/10/file-sample_150kB.pdf</Link>
                </p>
                <p className="sign-up-text mt-4">
                    Clarification:- Lorem ipsum dolor sit amet consectetur adipisicing elit. Minima quia alias vel laboriosam, ipsa nisi cum sint. Sequi fugit, molestias ut id aliquam ipsum quas minima omnis praesentium qui impedit.
                </p>
            </div>
        </Modal>
    );
};

export default ReqClarificationModal;
