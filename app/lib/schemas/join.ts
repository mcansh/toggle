import * as Yup from 'yup';
import reservedEmailAddressesList from 'reserved-email-addresses-list/index.json';
import reservedAdminList from 'reserved-email-addresses-list/admin-list.json';

const joinSchema = Yup.object().shape({
  email: Yup.string().email().required(),
  givenName: Yup.string().required('given name is a required field'),
  familyName: Yup.string().required('family name is a required field'),
  username: Yup.string()
    .required()
    .notOneOf(
      [...reservedEmailAddressesList, ...reservedAdminList],
      'A user with this username already exists'
    ),
  password: Yup.string().min(12).required(),
  confirmPassword: Yup.string().oneOf(
    [Yup.ref('password'), null],
    'Passwords must match'
  ),
});

type JoinSchema = Yup.InferType<typeof joinSchema>;

export { joinSchema, JoinSchema };
