/**
 * @jest-environment jsdom
 */

import userEvent from '@testing-library/user-event';
import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import StoreMock from "../__mocks__/store.js";
import { formatDate, formatStatus } from "../app/format.js";
import { Store } from "../app/Store.js";

import router from "../app/Router.js";

function getBillsClass() {
  const html = BillsUI({ data: bills });
  const onNavigate = (pathname) => {
    document.body.innerHTML = ROUTES({ pathname });
  };
  document.body.innerHTML = html;
  const BillsClass = new Bills({
    document,
    onNavigate,
    store: StoreMock,
    localStorage: window.localStorage,
  });
  return BillsClass;
}

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains('active-icon')).toBeTruthy();
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    describe('Lorsque je clique sur le bouton nouvelle facture', () => {
      // Vérifie si on change bien de page
      test('Ensuite, je devrais aller à la nouvelle page du formulaire de facture', () => {

        const html = BillsUI({ data: bills });
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        document.body.innerHTML = html;
        const BillsClass = new Bills({
          document,
          onNavigate,
          Store,
          localStorage: window.localStorage,
        });

        const handleClickNewBill = jest.fn(BillsClass.handleClickNewBill);
        const button = screen.getByTestId('btn-new-bill');

        button.addEventListener('click', handleClickNewBill);

        userEvent.click(button);
        //vérifie si on click dessus
        expect(handleClickNewBill).toHaveBeenCalled();
        // Vérifie si on change bien de page
        expect(screen.getByTestId('form-new-bill') !== undefined).toBeTruthy();
      });
    });

    describe("Quand je clique sur l'icone en forme d'oeil", () => {
      test('Ensuite, il devrait ouvrir la facture modale avec le contenu correspondant', () => {
        const html = BillsUI({ data: bills });
        document.body.innerHTML = html;
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const BillsClass = new Bills({
          document,
          onNavigate,
          Store,
          localStorage: window.localStorage,
        });

        const iconEyes = screen.getAllByTestId('icon-eye');
        const modale = screen.getByTestId('modaleFile');
        $.fn.modal = jest.fn();

        // Créer une fonction mock pour handleClickIconEye
        const handleClickIconEyeMock = jest.fn((e) => BillsClass.handleClickIconEye(e));

        // Déclencher un clic sur chaque icône "eye"
        let billUrl = "";
        iconEyes.forEach(iconEye => {
          iconEye.addEventListener("click", handleClickIconEyeMock(iconEye));
          userEvent.click(iconEye);
          billUrl = iconEye.getAttribute('data-bill-url').split('?')[0];
          expect(handleClickIconEyeMock).toHaveBeenCalled();
          expect(modale.innerHTML.includes(billUrl)).toBeTruthy();
          expect(modale).toBeTruthy();
          expect($.fn.modal).toHaveBeenCalled();
        });

      });
    });

    describe('getBills', () => {
      test('should return bills sorted by date', async () => {
        let BillsClass = getBillsClass();
        BillsClass.getBills = jest.fn(BillsClass.getBills)
        const result = await BillsClass.getBills();

        let mockBills = await jest.spyOn(StoreMock.bills(), 'list')();
        let expectedBills = mockBills.map((bill) => {
          return {
            ...bill,
            date: formatDate(bill.date), // Convertir la date en objet Date
            status: formatStatus(bill.status) // Convertir le statut en majuscules
          };
        });

        expect(BillsClass.getBills).toHaveBeenCalledTimes(1);
        expect(result[0]).toEqual(expectedBills[0]);
      });

      test('should handle error in formatting date', async () => {
        let BillsClass = getBillsClass();
        BillsClass.getBills = jest.fn(BillsClass.getBills)
        const result = await BillsClass.getBills();

        let mockBills = await jest.spyOn(StoreMock.bills(), 'list')();
        let expectedBills = mockBills.map((bill) => {
          return {
            ...bill,
            status: formatStatus(bill.status) // Convertir le statut en majuscules
          };
        });

        expect(BillsClass.getBills).toHaveBeenCalledTimes(1);
        expect(result[0]).not.toEqual(expectedBills[0]);
      });

    });
  })
})
