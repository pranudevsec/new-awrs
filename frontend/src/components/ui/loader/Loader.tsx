interface LoaderProps {
    inline?: boolean;
    size?: number;
}

const Loader: React.FC<LoaderProps> = ({ inline = false, size = 70 }) => {
    return (
        <div
            className={`loader-div ${inline ? "inline" : "fullpage"}`}
            style={inline ? {} : { minHeight: "calc(100vh - 180px)" }}
        >
            <div
                className="loader-bar"
                style={{ width: size, height: size }}
            ></div>
        </div>
    );
};

export default Loader;
