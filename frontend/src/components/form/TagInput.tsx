import { useState, type FC, type KeyboardEvent, } from 'react';

interface TagInputProps {
    label?: string;
    placeholder?: string;
    disabled?: boolean;
}

const TagInput: FC<TagInputProps> = ({
    label,
    placeholder = "Type and press enter...",
    disabled = false
}) => {
    const [tags, setTags] = useState<string[]>(["2024 - H1"]);
    const [input, setInput] = useState("");

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === "Enter" || e.key === ",") && input.trim()) {
            e.preventDefault();
            if (!tags.includes(input.trim())) {
                setTags([...tags, input.trim()]);
            }
            setInput("");
        }
    };

    const removeTag = (index: number) => {
        const newTags = tags.filter((_, i) => i !== index);
        setTags(newTags);
    };

    return (
        <div className="mb-3">
            {label && <label className="form-label mb-1">{label}</label>}

            <div
                className={`form-control d-flex flex-wrap align-items-center gap-2 tag-input-area ${disabled ? "disabled" : ""
                    }`}
            >
                {tags.map((tag, index) => (
                    <span className="tag-item" key={index}>
                        {tag}
                        {!disabled && (
                            <button type="button" className="tag-remove-btn" onClick={() => removeTag(index)}>
                                &times;
                            </button>
                        )}
                    </span>
                ))}
                {!disabled && (
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="tag-input-field"
                    />
                )}
            </div>
        </div>
    );
};

export default TagInput;
