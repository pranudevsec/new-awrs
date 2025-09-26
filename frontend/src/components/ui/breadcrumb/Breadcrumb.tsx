import { Link } from "react-router-dom";

interface BreadcrumbPath {
    label: string;
    href: string;
}

interface BreadcrumbProps {
    title: string;
    paths?: BreadcrumbPath[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ title, paths = [] }) => {
    return (
        <div className="main-breadcrumb mb-3">
            <h3 className="font-lexend fw-6">{title}</h3>
            {paths.length > 0 && (
                <div className="d-inline-flex align-items-center gap-2 flex-wrap mt-2">
                    {paths.map((path, index) => (
                        <div key={path.href} className="d-inline-flex align-items-center gap-2">
                            <Link to={path.href} className="fw-5">{path.label}</Link>
                            {index !== paths.length - 1 && <span className="rounded-circle"></span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Breadcrumb;
