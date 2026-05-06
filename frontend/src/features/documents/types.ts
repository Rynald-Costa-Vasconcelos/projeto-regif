export type SortOrder = "newest" | "oldest";

export type Filters = {
  q: string;
  categoryId: string;
  date: string;
  dateFrom: string;
  dateTo: string;
  sort: SortOrder;
  pageSize: number;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
