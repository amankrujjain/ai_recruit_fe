export function isJobActive(job) {
  const value = job?.isActive;
  if (value === false || value === 'false' || value === 0 || value === '0') {
    return false;
  }
  if (value === true || value === 'true' || value === 1 || value === '1') {
    return true;
  }
  return Boolean(value);
}

export function filterJobsByStatusFilter(items, statusFilter) {
  if (statusFilter === 'active') {
    return items.filter((job) => isJobActive(job));
  }
  if (statusFilter === 'inactive') {
    return items.filter((job) => !isJobActive(job));
  }
  return items;
}

export function getJobsListEmptyState(statusFilter = 'all', hasSearch = false) {
  if (hasSearch) {
    return {
      message: 'No jobs match your search.',
      showCreateCta: false,
    };
  }
  if (statusFilter === 'active') {
    return {
      message: 'No active jobs.',
      showCreateCta: false,
    };
  }
  if (statusFilter === 'inactive') {
    return {
      message: 'No inactive jobs.',
      showCreateCta: false,
    };
  }
  return {
    message: 'No jobs yet.',
    showCreateCta: true,
  };
}
