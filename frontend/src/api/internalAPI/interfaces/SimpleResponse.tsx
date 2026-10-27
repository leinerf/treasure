import type { BaseResponse } from "./BaseResponse";

export type SimpleResponse = Omit<BaseResponse, "data">;