import { render, screen, fireEvent } from '@testing-library/react';
import Footer from './Footer';

describe('Footer Component', () => {
    test('renders logo, links, and copyright text', () => {
      render(<Footer />);
      
      // Verify the footer element is rendered (by default, <footer> gets the "contentinfo" role)
      const footerElement = screen.getByRole('contentinfo');
      expect(footerElement).toBeInTheDocument();
      
      // Verify the logo image is present with the correct alt text
      const logo = screen.getByAltText(/BullyBlock Logo/i);
      expect(logo).toBeInTheDocument();
      
      // Verify the three footer links are rendered with the expected text
      const privacyLink = screen.getByText(/Privacy Policy/i);
      const termsLink = screen.getByText(/Terms of Service/i);
      const contactLink = screen.getByText(/Contact Us/i);
      
      expect(privacyLink).toBeInTheDocument();
      expect(termsLink).toBeInTheDocument();
      expect(contactLink).toBeInTheDocument();
      
      // Check that the links have the correct href attribute (which is '#' in this case)
      expect(privacyLink).toHaveAttribute('href', '#');
      expect(termsLink).toHaveAttribute('href', '#');
      expect(contactLink).toHaveAttribute('href', '#');
      
      // Verify that the copyright text is present
      expect(
        screen.getByText(/© 2025 BullyBlock\. All rights reserved\./i)
      ).toBeInTheDocument();
    });
  });