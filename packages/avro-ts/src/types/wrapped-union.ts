import { schema, Schema } from 'avsc';
import { Convert, Context } from '../types';
import { Type, mapWithContext, document } from '@ovotech/ts-compose';
import { isUnion } from './union';
import { isRecordType } from './record';
import { convertType } from '../convert';
import { fullName } from '../helpers';

export const isWrappedUnion = (type: Schema, context: Context): type is schema.RecordType[] =>
  isUnion(type) &&
  type.length > 1 &&
  type.every((item) =>
    typeof item === 'string' && context.refs?.[item]
      ? isRecordType(context.refs?.[item])
      : isRecordType(item),
  );

export const convertWrappedUnionType: Convert<schema.RecordType[]> = (context, schema) => {
  const map = mapWithContext(context, schema, (itemContext, item) => {
    const converted = convertType(itemContext, item);
    return {
      context: converted.context,
      type: Type.TypeLiteral({
        props: schema.map((schemaItem) =>
          Type.Prop({
            name: fullName(context, schemaItem),
            isOptional: schemaItem.name === item.name ? false : true,
            type: schemaItem.name === item.name ? converted.type : Type.Never,
          }),
        ),
      }),
    };
  });

  return document(map.context, Type.Union(map.items));
};
