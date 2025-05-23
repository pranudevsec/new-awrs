import Modal from 'react-bootstrap/Modal';
import FormInput from '../components/form/FormInput';

interface ClarificationModalProps {
    show: boolean;
    handleClose: () => void;
}

const ClarificationModal: React.FC<ClarificationModalProps> = ({
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
            <Modal.Body className="p-4 bg-white rounded-3 shadow">
                <div className='mb-4'>
                    <FormInput
                        label="Clarification popup"
                        name="cyclePeriod"
                        placeholder="Maximum 200 Words...."
                        type="text"
                        as='textarea'
                        rows={8}
                        value=""
                    />
                </div>
                <button type="button" className="submit-btn border-0" onClick={handleClose}>
                    Submit
                </button>
            </Modal.Body>
        </Modal>
    );
};

export default ClarificationModal;
