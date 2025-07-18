import Modal from 'react-bootstrap/Modal';

interface DeleteModalProps {
    name: string;
    titleName?: string;
    show: boolean;
    handleClose: () => void;
    handleDelete: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
    name,
    titleName,
    show,
    handleClose,
    handleDelete,
}) => {
    return (
        <Modal centered show={show} onHide={handleClose} className="delete-modal">
            <div className="modal-body text-center mb-2 p-0">
                <div className="icon pt-3">
                    <img src="/media/icons/warning.png" alt="Warning" className="img-fluid mx-auto" />
                </div>
                <div className="text my-4">
                    <h3 className="font-lexend fw-6 mb-2">Delete {titleName ?? name}</h3>
                    <p>
                        Are you sure you want to delete this {name.toLowerCase()}? You will not be able to
                        recover the deleted record!
                    </p>
                </div>
            </div>
            <div className="modal-footer justify-content-between border-0 justify-content-center p-0">
                <button type="button" className="_btn danger"
                    onClick={handleDelete}
                >
                    Yes, Delete
                </button>
                <button
                    type="button"
                    className="_btn outline"
                    onClick={handleClose}
                >
                    Cancel
                </button>
            </div>
        </Modal>
    );
};

export default DeleteModal;
