import FormSelect from '../../../components/form/FormSelect';

const topCandidateOptions :any= [
    { value: 3, label: 'Top 3' },
    { value: 5, label: 'Top 5' },
    { value: 10, label: 'Top 10' },
    { value: 20, label: 'Top 20' },
];

const TopCandidates = () => {

    const handleDownload = () => {
        // Simulate or trigger actual report download
        console.log(`Downloading report for Top ${topCandidateOptions[1].value} candidates...`);
        // You can replace this with actual API logic or file generation
    };

    return (
        <div className="unit-score-chart h-100">
            <div className=" d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
                <h2 className="fw-6">Export Top Candidates</h2>
                <div className="mt-5 d-flex flex-column gap-3">
  <FormSelect
    name="topCandidates"
    options={topCandidateOptions}
    value={topCandidateOptions.find((opt:any) => opt.value === topCandidateOptions[1].value) || null}
    placeholder="Select"
  />
  <button
    type="submit"
    className="_btn _btn-lg primary w-100"
    onClick={handleDownload}
  >
    Download Report
  </button>
</div>



                   
            </div>
        </div>
    );
};

export default TopCandidates;
