import { Params } from "react-router-dom";
import { string2Date } from "../components";
import {
  AbstractDataType,
  AbstractFormDataType,
  AbstractSchemaType,
  HandlerType,
} from "./types";

const createHandlers = <T extends AbstractDataType>(
  url: string
): HandlerType<T> => {
  const getAllData = async (): Promise<Array<T>> => {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(response);
    }

    const result = await response.json();
    return result;
  };

  const getDataById = async (id: string): Promise<T> => {
    const response = await fetch(`${url}/${id}`);
    if (!response.ok) {
      console.error(response);
    }

    const result = await response.json();
    return result;
  };

  const createData = async (data: T): Promise<T> => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      console.error(response);
    }

    const result = await response.json();
    return result;
  };

  const updateData = async (data: T, id: string): Promise<T> => {
    const response = await fetch(`${url}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      console.error(response);
    }

    const result = await response.json();
    return result;
  };

  const deleteData = async (id: string) => {
    const response = await fetch(`${url}/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      console.error(response);
    }

    const result = await response.json();
    return result;
  };

  return {
    getAllData: getAllData,
    getDataById: getDataById,
    createData: createData,
    updateData: updateData,
    deleteData: deleteData,
  };
};

const createLoaderAction = <T extends AbstractDataType, Key extends string>(
  url: string,
  schema: AbstractSchemaType<T>,
  idKey: Key
) => {
  const handlers: HandlerType<T> = createHandlers(url);
  const parseData = async (request: Request): Promise<T> => {
    const formData = await request.formData();
    const formDataObj: AbstractFormDataType<T> = Object.fromEntries(
      formData.entries()
    ) as AbstractFormDataType<T>;
    return Object.entries(formDataObj).reduce((acc, dataEntry) => {
      let [key, value] = dataEntry;
      if (schema[key].type === "date") {
        acc[key] = string2Date(value);
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as any) as T;
  };
  const loaderAll = async () => {
    return await handlers.getAllData();
  };
  const loaderById = async ({ params }: { params: Params<Key> }) => {
    return await handlers.getDataById(params[idKey]!);
  };
  const actionCreate = async ({ request }: { request: Request }) => {
    console.log("Create action");
    const submitData = await parseData(request);
    let result = await handlers.createData(submitData);
    console.log("POST result", result);
    return result;
  };
  const actionUpdate = async ({
    request,
    params,
  }: {
    request: Request;
    params: Params<Key>;
  }) => {
    const submitData = await parseData(request);
    return await handlers.updateData(submitData, params[idKey]!);
  };
  const actionDelete = async ({ params }: { params: Params<Key> }) => {
    return await handlers.deleteData(params[idKey]!);
  };
  return {
    handlers: handlers,
    loaderAll: loaderAll,
    loaderById: loaderById,
    actionCreate: actionCreate,
    actionUpdate: actionUpdate,
    actionDelete: actionDelete,
  };
};

export { createHandlers, createLoaderAction };