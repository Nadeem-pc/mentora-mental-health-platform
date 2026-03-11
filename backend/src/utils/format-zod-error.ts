import { ZodError, ZodIssueCode } from "zod";
import { HttpResponse } from "../constants/response-message.constant";

interface FormattedError {
  [key: string]: string;
}

const formatZodErrors = (error: ZodError): FormattedError => {
  const formattedErrors: FormattedError = {};

  error.issues.forEach((issue) => {
    const field = issue.path[0];
    const message = issue.message;

    if (issue.code === ZodIssueCode.unrecognized_keys) {
      const keys = (issue as unknown as { keys?: string[] }).keys ?? [];
      keys.forEach((key: string) => {
        formattedErrors[key] = HttpResponse.UNEXPECTED_KEY_FOUND;
      });
      return;
    }

    if (typeof field === "string") {
      formattedErrors[field] = message;
      return;
    }
  });

  return formattedErrors;
};

export default formatZodErrors;