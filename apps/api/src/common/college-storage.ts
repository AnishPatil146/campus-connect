import { AsyncLocalStorage } from 'async_hooks';

export interface CollegeContext {
  collegeId: string;
}

export const collegeStorage = new AsyncLocalStorage<CollegeContext>();
