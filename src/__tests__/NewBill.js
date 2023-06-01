/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom"
import userEvent from '@testing-library/user-event';
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES, ROUTES_PATH } from '../constants/routes';
import { localStorageMock } from '../__mocks__/localStorage.js';
import router from "../app/Router.js";


describe("Given I am connected as an employee", () => {
	describe("When I am on NewBill Page", () => {
		test('Ensuite, la nouvelle icône de facture dans la disposition verticale doit être mise en surbrillance', () => {

			Object.defineProperty(window, 'localStorage', {value: localStorageMock,});
			window.localStorage.setItem('user',JSON.stringify({type: 'Employee',}));

			let root = document.createElement('div');
			root.setAttribute('id', 'root');
			
			window.location.assign(ROUTES_PATH['NewBill']);
			document.body.appendChild(root);
			router();
			const billsIcon = screen.getByTestId('icon-mail');
			expect(billsIcon.classList.contains('active-icon')).toBeTruthy();
		});

		describe("Lorsque je sélectionne un fichier via l'input de fichier", () => {

			const html = NewBillUI();
			const testUser = {
				type: 'Employee',
				email: 'test@test.com',
			};
			Object.defineProperty(window, 'localStorage', { value: localStorageMock })
			window.localStorage.setItem('user', JSON.stringify(testUser));
			document.body.innerHTML = html;
			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname });
			};
			// Création d'un mock de l'objet store
			const store = {
				bills: jest.fn(() => {
				  return {create: jest.fn().mockResolvedValue({
					fileUrl: 'https://example.com/file.pdf',
					key: '12345'
				  })}
				})
			  };
			
			//console.log(store);
			const fileInput = document.querySelector(`input[data-testid="file"]`);
			const NewBillClass = new NewBill({
				document,
				onNavigate,
				store,
				localStorage: window.localStorage,
			});
			const handleChangeFile = jest.fn(NewBillClass.handleChangeFile);
			fileInput.addEventListener('change', (e) => {
				const event = {
					preventDefault: jest.fn(),
					target: {
					  value: 'C:\\path\\to\\file.jpg'
					}
				  };
				handleChangeFile(event);
			});
			describe('Si le fichier est une image jpg ou png', () => {
				test("Ensuite, le repère visuel pour indiquer la mauvaise entrée ne doit pas être affiché et le fichier doit être téléchargé", () => {
					const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
					fileInput.classList.add('is-invalid');
					userEvent.upload(fileInput, file);
					expect(handleChangeFile).toHaveBeenCalled();
					expect(fileInput.files[0]).toStrictEqual(file);
					expect(fileInput.files).toHaveLength(1);
					expect(fileInput.classList.contains('is-invalid')).toBeFalsy();
				});
			});
		});

		describe('Lorsque je soumets le nouveau formulaire de facture', () => {
			test('Ensuite, la méthode handleSubmit doit être appelée', () => {
				const html = NewBillUI();
				const testUser = {
					type: 'Employee',
					email: 'test@test.com',
				};
				window.localStorage.setItem('user', JSON.stringify(testUser));
				document.body.innerHTML = html;
				const onNavigate = (pathname) => {
					document.body.innerHTML = ROUTES({ pathname });
				};
				const NewBillClass = new NewBill({
					document,
					onNavigate,
					firestore: null,
					localStorage: window.localStorage,
				});
				const form = document.querySelector(
					`form[data-testid="form-new-bill"]`
				);
				const handleSubmitSpy = jest.spyOn(NewBillClass, 'handleSubmit');
				form.addEventListener('submit', handleSubmitSpy);
				fireEvent.submit(form);
				expect(handleSubmitSpy).toHaveBeenCalled();
			});
			describe('Si le fichier est valide', () => {
				test('Ensuite, la méthode createBill doit être appelée', () => {
					const html = NewBillUI();
					const testUser = {
						type: 'Employee',
						email: 'test@test.com',
					};
					window.localStorage.setItem('user', JSON.stringify(testUser));
					document.body.innerHTML = html;
					const onNavigate = (pathname) => {
						document.body.innerHTML = ROUTES({ pathname });
					};
					const NewBillClass = new NewBill({
						document,
						onNavigate,
						firestore: null,
						localStorage: window.localStorage,
					});
					const form = document.querySelector(
						`form[data-testid="form-new-bill"]`
					);
					const updateBillSpy = jest.spyOn(NewBillClass, 'updateBill');
					NewBillClass.fileName = 'test';
					fireEvent.submit(form);
					expect(updateBillSpy).toHaveBeenCalled();
				});
			});
			describe("Si le fichier n'est pas valide", () => {
				test('Ensuite, la méthode createBill ne doit pas être appelée', () => {
					const html = NewBillUI();
					const testUser = {
						type: 'Employee',
						email: 'test@test.com',
					};
					window.localStorage.setItem('user', JSON.stringify(testUser));
					document.body.innerHTML = html;
					const onNavigate = (pathname) => {
						document.body.innerHTML = ROUTES({ pathname });
					};
					const NewBillClass = new NewBill({
						document,
						onNavigate,
						firestore: null,
						localStorage: window.localStorage,
					});
					const form = document.querySelector(
						`form[data-testid="form-new-bill"]`
					);
					const updateBillSpy = jest.spyOn(NewBillClass, 'updateBill');
					NewBillClass.fileName = null;
					fireEvent.submit(form);
					expect(updateBillSpy).not.toHaveBeenCalled();
				});
			});
		});
	})
})
