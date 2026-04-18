import StyledSelect from "./StyledSelect";

function PaginationControls({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20],
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = totalItems === 0 ? 0 : Math.min(totalItems, page * pageSize);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm">
      <div className="text-slate-600">
        Showing <span className="font-semibold text-slate-800">{start}</span>
        {" "}to <span className="font-semibold text-slate-800">{end}</span>
        {" "}of <span className="font-semibold text-slate-800">{totalItems}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-slate-600">Rows</span>
        <StyledSelect
          id="page-size-select"
          name="pageSize"
          className="w-20"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          menuPlacement="top"
          options={pageSizeOptions.map((option) => ({
            value: option,
            label: String(option),
          }))}
        />

        <button
          type="button"
          className="btn-secondary px-3 py-1.5"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Prev
        </button>

        <span className="px-1 font-medium text-slate-700">
          Page {page} / {totalPages}
        </span>

        <button
          type="button"
          className="btn-secondary px-3 py-1.5"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default PaginationControls;