import {
  SchemaType,
  FetchDataArrayType,
  FetchDataType,
  SubmissionFormType,
} from "../components";
import { Params } from "react-router-dom";
import { getSubmissionValue } from "../components";

class Handler<T extends SchemaType, Key extends string> {
  schema: T;
  url: string;
  idKey: Key;

  constructor(schema: T, url: string, idKey: Key) {
    this.schema = schema;
    this.url = url;
    this.idKey = idKey;
  }
  protected getAllData = async (
    title?: string | null,
  ): Promise<FetchDataArrayType> => {
    const response = await fetch(
      title ? this.url + "?" + new URLSearchParams({ title: title }) : this.url,
    );

    if (!response.ok) {
      console.error(response);
      throw response;
    }

    const result = await response.json();
    return result as FetchDataArrayType;
  };
  protected getDataById = async (id: string): Promise<FetchDataType> => {
    const response = await fetch(`${this.url}/${id}`);
    if (!response.ok) {
      console.error(response);
      throw response;
    }

    const result = await response.json();
    return result as FetchDataType<T>;
  };
  protected createData = async (
    data: SubmissionFormType,
  ): Promise<FetchDataType> => {
    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw response;
    }

    const result = await response.json();
    return result as FetchDataType;
  };
  protected updateData = async (
    data: SubmissionFormType<T>,
    id: string,
  ): Promise<FetchDataType<T>> => {
    const response = await fetch(`${this.url}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      console.error(response);
      throw response;
    }

    const result = await response.json();
    return result as FetchDataType<T>;
  };
  protected deleteData = async (id: string): Promise<Response> => {
    const response = await fetch(`${this.url}/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      console.error(response);
      throw response;
    }
    return response;
  };
  protected parseData = async (
    request: Request,
  ): Promise<SubmissionFormType<T>> => {
    const formData = await request.formData();

    return Object.entries(formData).reduce((acc, dataEntry) => {
      const [key, value] = dataEntry;
      if (key in this.schema) {
        const fValue = getSubmissionValue(this.schema[key], value);
        if (key in acc) {
          acc[key].push(fValue);
        } else {
          acc[key] = fValue;
        }
      } else {
        throw new Error("Key cannot be found in schema: " + key);
      }
      return acc;
    }, {} as any);
  };

  public loaderAll = async ({
    request,
  }: {
    request: Request;
  }): Promise<FetchDataArrayType<T>> => {
    try {
      const url = new URL(request.url);
      const title = url.searchParams.get("title");
      return await this.getAllData(title);
    } catch (error) {
      return null;
    }
  };
  public loaderById = async ({
    params,
  }: {
    params: Params<Key>;
  }): Promise<FetchDataType<T>> => {
    try {
      return await this.getDataById(params[this.idKey]!);
    } catch (error) {
      return null;
    }
  };
  public actionCreate = async ({ request }: { request: Request }) => {
    const submitData = await this.parseData(request);
    const result = await this.createData(submitData);
    return result;
  };
  public actionUpdate = async ({
    request,
    params,
  }: {
    request: Request;
    params: Params<Key>;
  }) => {
    const submitData = await this.parseData(request);
    const result = await this.updateData(submitData, params[this.idKey]!);
    return result;
  };
  public actionDelete = async ({ params }: { params: Params<Key> }) => {
    const result = await this.deleteData(params[this.idKey]!);
    return result;
  };
}

export { Handler };
