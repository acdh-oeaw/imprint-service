import type { ValidationTargets } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator as honoValidator } from "hono/validator";
import * as v from "valibot";

export function validator<
	TValidationTarget extends keyof ValidationTargets,
	TValidationSchema extends v.GenericSchema | v.GenericSchemaAsync,
>(target: TValidationTarget, schema: TValidationSchema) {
	return honoValidator(target, async (value) => {
		try {
			return await v.parseAsync(schema, value);
		} catch (error) {
			throw new HTTPException(400, { cause: error, message: "Invalid input" });
		}
	});
}
