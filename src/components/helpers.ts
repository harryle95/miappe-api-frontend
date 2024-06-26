import {
  SchemaElementType,
  SchemaType,
  SubmissionElementType,
  SubmissionFormType,
} from "./types";

const getTitleKey = (schema: SchemaElementType): string => {
  return schema.titleKey ? schema.titleKey : "title";
};

const getMultipleValue = (schema: SchemaElementType): boolean => {
  return schema.multiple ? true : false;
};

/**
 * Get hidden prop value for an input/select element.
 *
 * If schema.hidden is provided, this value will be used.
 *
 * @param schema - schema of given field
 * @param key - name prop of input/select
 * @returns - boolean results on whether the input/select element should be hidden
 */
const getHiddenValue = (schema: SchemaElementType): boolean => {
  return schema.hidden ? true : false;
};

/**
 * Get defaultValue prop's value for an input or select element,
 * given value obtained from a remove server. This function is
 * used to set default value for a field in update form (PUT).
 *
 * If value type is date, extract only the date portion of the value
 *
 * @param schema - schema of given field. Used to determine the default value
 * @param value - value obtained from remote. Could be null
 * @returns value to be set as defaultValue prop for input/select
 */
const getDefaultValue = (
  schema: SchemaElementType,
  value: string | string[] | null | undefined,
): string | string[] => {
  if (!Array.isArray(value)) {
    return _getDefaultValue(schema, value);
  } else {
    return value.map(item => _getDefaultValue(schema, item));
  }
};

const _getDefaultValue = (
  schema: SchemaElementType,
  value: string | null | undefined,
): string => {
  if (value) {
    switch (schema.type) {
      case "date":
        return value.substring(0, 10);
      default:
        return value;
    }
  }
  return "";
};

const capitalise = (key: string) => {
  return key.length >= 1 ? key[0].toUpperCase() + key.slice(1) : key;
};

/**
 * Get the string to be display as table header field. If
 * provided in schema, the capitalised schema value will be used. Otherwise,
 * return the original key capitalised with trailing Id removed
 *
 * The main use case of this is when header field is different from submission key
 * (the key param or the name of corresponding input/select). For instance, `Study`
 * references `Investigation` with `investigation_id` attribute in the backend.
 * Key or input name is thus set as `investigationId`. If labelKey is not provided,
 * the label value will be `investigation`
 *
 * @param schema - schema correspond to given key.
 * @param key - key of an entry in Schema
 * @returns string display value of label
 */
const getTableDisplayKey = (schema: SchemaElementType, key: string): string => {
  return capitalise(schema.labelKey ? schema.labelKey : key);
};

/**
 * Get the string to be display as form header field. Use the result of getTableDisplayKey + *
 * if required
 *
 * @param schema - schema correspond to given key.
 * @param key - key of an entry in Schema
 * @returns string display value of label
 */
const getFormDisplayKey = (schema: SchemaElementType, key: string): string => {
  const retVal = getTableDisplayKey(schema, key);
  return schema.required ? retVal + "*" : retVal;
};

/**
 * Get the value to be set as placeholder for a form input. If placeholder value is provided in
 * schema, returns it. Otherwise use Enter + getTableDisplayKey result
 *
 * @param schema - schema correspond to given key.
 * @param key - key of an entry in Schema
 * @returns string display value of label
 */
const getPlaceHolderValue = (
  schema: SchemaElementType,
  key: string,
): string => {
  if (schema.placeholder) return schema.placeholder;
  return "Enter " + getTableDisplayKey(schema, key);
};

/** Get schema required value. Returns true only if required: true is provided in the schema
 *
 * @param schema - schema correspond to given key.
 * @param key - key of an entry in Schema
 * @returns whether the value is required
 */
const getRequired = (schema: SchemaElementType): boolean => {
  return schema.required ? true : false;
};

/**
 * Get fetcher key associated with select element. This fetcher key is used to get
 * the fetcher that loads data from corresponding route. For instance, a fetcher key
 * of `investigation` loads the fetched value from loader of `/investigation`.
 *
 * If provided in schema, schema.fetcherKey is returned. Otherwise remove the trailing
 * Id of the associated key (name prop of select element).
 *
 * The main use case of this is when fetcher key is different from param key or name prop of
 * the select element. For instance, in the backend, `Institution` has an attribute `institution_type`
 * that is an alias for `vocabulary`'s id. Hence key or name prop of schema should be `institutionType`
 * and schema.fetcherKey should be vocabulary (since vocabulary data is fetched from /vocabulary)
 *
 * @param schema - schema correspond to given key.
 * @param key - key of an entry in Schema. This is also the value of name prop of the select element
 * @returns - fetcherKey value
 */
const getFetcherKey = (schema: SchemaElementType, key: string): string => {
  return schema.fetcherKey ? schema.fetcherKey : key;
};

/**
 * Get associated submission value from FormData. By default, formData obtained via form submission
 * are string or File. Date type will not be serialised properly and will either not be accepted
 * by the backend or require processing in the backend which is not idea.
 *
 * This function simply returns the value as is if schema type is not date. Otherwise convert given
 * value to date if rawValue is not "".
 *
 * @param schema
 * @param rawValue
 * @returns
 */
const getSubmissionValue = (
  schema: SchemaElementType,
  rawValue: FormDataEntryValue,
): SubmissionElementType => {
  if (rawValue === "") return null;
  if (schema.type === "date" && typeof rawValue === "string")
    return new Date(rawValue);
  else return rawValue;
};

const parseFormData = (
  schema: SchemaType,
  formData: FormData,
): SubmissionFormType => {
  const submitData: SubmissionFormType = {};
  for (const pair of formData.entries()) {
    const [key, value] = pair;
    // Not in schema -> skip
    if (key in schema) {
      const elementSchema = schema[key];
      if (getMultipleValue(elementSchema) && elementSchema.type == "select") {
        if (value == "") {
          submitData[key] = null;
          continue;
        }
        if (key in submitData) {
          (submitData[key] as string[]).push(value as string);
        } else {
          submitData[key] = [value as string];
        }
      } else {
        submitData[key] = getSubmissionValue(elementSchema, value);
      }
    }
  }
  return submitData;
};

/**
 * ABC for schema type. This class can be extended to specify data schema.
 * This is to avoid having to define a schema.json file and a schema.type.ts
 * file with duplicated information
 */
class BaseSchema implements SchemaType {
  id: SchemaElementType = { type: "text", hidden: true };
  createdAt: SchemaElementType = {
    type: "date",
    hidden: true,
  };
  updatedAt: SchemaElementType = {
    type: "date",
    hidden: true,
  };
  [k: string]: SchemaElementType;
}

export {
  getDefaultValue,
  getTableDisplayKey,
  getFetcherKey,
  getSubmissionValue,
  getHiddenValue,
  getFormDisplayKey,
  getPlaceHolderValue,
  getRequired,
  getMultipleValue,
  parseFormData,
  getTitleKey,
  capitalise,
  BaseSchema,
};
