import { z } from "zod";

type Option = {
  value: any;
  fields?: Field[];
};

type Field = {
  type: string;
  name: string;
  required?: boolean;
  inputType?: string;
  options?: Option[];
  steps?: string[];
  fields?: Field[];
};

type Section = {
  fields: Field[];
};

type FormConfig = {
  sections: Section[];
};

const generateFieldSchema = (field: Field): z.ZodTypeAny => {
  let schema: z.ZodTypeAny;

  switch (field.type) {
    case "Input":
      if (field.inputType === "number") {
        schema = z.preprocess((val) => {
          if (val === "" || val === null || val === undefined) return undefined;
          const n = Number(val);
          return isNaN(n) ? undefined : n;
        }, z.number());
      } else if (field.inputType === "date") {
        schema = z.preprocess(
          (val) => (val === "" ? undefined : val),
          z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
        );
      } else {
        schema = z.string();
      }
      break;
    case "Checkbox":
      schema = z.boolean();
      break;
    case "Radio":
      if (field.options && field.options.length > 0) {
        const hasBooleanOptions = field.options.some(
          (opt) => typeof opt.value === "boolean"
        );

        if (hasBooleanOptions) {
          schema = z
            .union([z.boolean(), z.literal("true"), z.literal("false")])
            .transform((val) => val === true || val === "true");
        } else {
          const values = field.options.map((opt) => String(opt.value)) as [
            string,
            ...string[]
          ];
          if (values.length > 0) {
            schema = z.enum(values);
          } else {
            schema = z.any();
          }
        }
      } else {
        schema = z.string();
      }
      break;
    case "CheckboxGroup":
      schema = z.array(z.string());
      break;
    case "Select":
      if (field.options && field.options.length > 0) {
        const values = field.options.map((opt) => opt.value) as [
          string,
          ...string[]
        ];
        if (values.length > 0) schema = z.enum(values);
        else schema = z.any();
      } else {
        schema = z.string();
      }
      break;
    case "Range":
      if (field.steps && field.steps.length > 0) {
        schema = z.enum(field.steps as [string, ...string[]]);
      } else {
        schema = z.string();
      }
      break;
    case "RevealRadio":
    case "RevealCheckBox":
      // For reveal types, we make the main field optional, and its sub-fields will be handled separately.
      if (field.options && field.options.length > 0) {
        const values = field.options.map((opt) => opt.value) as [
          string,
          ...string[]
        ];
        if (values.length > 0) schema = z.enum(values);
        else schema = z.any();
      } else {
        schema = z.boolean();
      }
      break;
    case "TeethSelector":
      schema = z.any(); // Complex component, basic validation for now
      break;
    default:
      schema = z.any();
  }

  if (!field.required) {
    return schema.optional();
  }

  return schema;
};

const getAllFields = (sections: Section[]): Field[] => {
  const allFields: Field[] = [];

  function recurse(fields: Field[], isNested: boolean) {
    for (const field of fields) {
      const newField = { ...field };
      if (isNested) {
        newField.required = false; // Override required for nested fields
      }
      allFields.push(newField);

      if (newField.fields) {
        recurse(newField.fields, true);
      }
      if (newField.options) {
        for (const option of newField.options) {
          if (option.fields) {
            recurse(option.fields, true);
          }
        }
      }
    }
  }

  sections.forEach((section) => recurse(section.fields, false));
  return allFields;
};

export const generateSchemaFromConfig = (
  config: FormConfig
): z.ZodObject<any> => {
  const allFields = getAllFields(config.sections);

  const shape: { [key: string]: z.ZodTypeAny } = {};
  allFields.forEach((field) => {
    shape[field.name] = generateFieldSchema(field);
  });

  return z.object(shape);
};
