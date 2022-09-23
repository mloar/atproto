/**
* GENERATED CODE - DO NOT MODIFY
* Created Thu Sep 22 2022
*/
import express from 'express'

export interface QueryParams {
  did: string;
  type: string;
  tid: string;
}

export type HandlerInput = undefined
export type HandlerOutput = void
export type Handler = (
  params: QueryParams,
  input: HandlerInput,
  req: express.Request,
  res: express.Response
) => Promise<HandlerOutput> | HandlerOutput