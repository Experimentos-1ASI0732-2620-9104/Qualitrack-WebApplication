import { AlertPersonAssembler } from './alert-person-assembler';

describe('AlertPersonAssembler', () => {
  const assembler = new AlertPersonAssembler();
  const namesOf = (...args: Parameters<AlertPersonAssembler['toEntities']>) =>
    Object.fromEntries(assembler.toEntities(...args).map((person) => [person.id, person.name]));

  it('names a staff member by their full name rather than their username', () => {
    expect(
      namesOf(
        [{ id: 12, username: 'billy@lab.pe' }],
        [{ fullName: 'Billy Ruiz', userId: 12 }],
        null,
      ),
    ).toEqual({ 12: 'Billy Ruiz' });
  });

  it('names by username whoever is not a staff member, such as the owner of the laboratory', () => {
    expect(namesOf([{ id: 3, username: 'owner@lab.pe' }], [], null)).toEqual({ 3: 'owner@lab.pe' });
  });

  it('uses the name of the signed-in user, who can read their own profile', () => {
    expect(
      namesOf([{ id: 3, username: 'owner@lab.pe' }], [], { userId: 3, fullName: 'Ana Soto' }),
    ).toEqual({ 3: 'Ana Soto' });
  });

  it('keeps the username when the profile of the signed-in user has no name', () => {
    expect(
      namesOf([{ id: 3, username: 'owner@lab.pe' }], [], { userId: 3, fullName: null }),
    ).toEqual({ 3: 'owner@lab.pe' });
  });

  it('leaves out the staff registered before accounts existed', () => {
    expect(namesOf([], [{ fullName: 'Old Staff', userId: null }], null)).toEqual({});
  });
});
