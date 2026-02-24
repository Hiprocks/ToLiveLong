import { format } from "date-fns";

export const getLocalDateString = (date = new Date()) => format(date, "yyyy-MM-dd");
