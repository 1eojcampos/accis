<website_design>
The 3D Printing Services Platform is a sophisticated web application designed as a comprehensive marketplace connecting users with local 3D printing providers. The interface follows a clean, tech-forward aesthetic with a dark theme that emphasizes professionalism and innovation.

The application opens with a hero section featuring a split layout showcasing the platform interface on a dark background, immediately communicating the technical nature of the service. The main interface is organized into distinct functional areas:

A navigation system provides access to core features: Browse Printers, Create Order, Track Orders, and Provider Dashboard. The primary user flow centers around a multi-step order creation process, allowing users to upload 3D models, specify materials and requirements, and receive quotes from nearby providers.

The provider discovery section displays available 3D printers and services in an organized grid, with detailed provider profiles showing capabilities, ratings, pricing, and availability. An integrated order tracking system provides real-time status updates with a clean progress indicator and messaging interface for provider communication.

The design maintains consistency through a monochromatic color scheme with strategic use of emerald green as the primary accent color, professional typography, and generous whitespace that creates a premium, trustworthy feel appropriate for a technical service marketplace.
</website_design>

<high_level_design>
1. Color palettes:
   | Token | Value | Usage |
   |-------|-------|-------|
   | Primary | Emerald (#10b981) | CTAs, active states, progress indicators, success states |
   | Neutral | Gray scale (#1f2937 to #f9fafb) | Backgrounds, text, borders, subtle UI elements |

2. Typography: Inter font family - clean, modern, highly legible at all sizes with excellent technical aesthetic
</high_level_design>

<components>
<edit_component>
<file_path>src/components/blocks/heros/split-with-screenshot-on-dark.tsx</file_path>
<design_instructions>Update the hero section for the 3D printing marketplace platform. Change the main headline to "On-Demand 3D Printing Services" and subtitle to "Connect with local 3D printing providers, upload your designs, and get professional prints delivered to your door." Update the CTA buttons to "Find Printers Nearby" (primary) and "Become a Provider" (secondary). Replace the screenshot with a sleek interface mockup showing a 3D printer selection grid. Use Inter font family throughout and emerald green (#10b981) for accent colors. Maintain the dark theme aesthetic.</design_instructions>
<references>src/components/blocks/heros/split-with-screenshot-on-dark.tsx</references>
</edit_component>

<create_component>
<file_path>src/components/blocks/order-creation.tsx</file_path>
<design_instructions>Create a comprehensive order creation section with a clean, multi-step interface. Include a file upload area with drag-and-drop functionality for 3D model files (.STL, .OBJ support), material selection dropdown (PLA, ABS, PETG, Resin, Metal), quantity selector, quality settings (Draft, Standard, High Quality), and special requirements text area. Display a quote estimation panel on the right showing estimated cost, timeline, and nearby providers count. Use Inter font family, emerald accent color (#10b981), and maintain dark theme consistency with the rest of the application. Include clear step indicators and progress tracking.</design_instructions>
</create_component>

<create_component>
<file_path>src/components/blocks/provider-discovery.tsx</file_path>
<design_instructions>Design a provider discovery section displaying local 3D printing services in a clean grid layout. Each provider card should show printer type/model, available materials, hourly rate, distance, rating with stars, and current availability status. Include filter options for printer type (FDM, SLA, SLS), materials, price range, and distance radius. Add a map view toggle option. Use emerald green for active filters and available status indicators. Maintain professional spacing and Inter typography. Include "View Profile" and "Request Quote" buttons on each card with hover effects.</design_instructions>
</create_component>

<create_component>
<file_path>src/components/blocks/order-tracking.tsx</file_path>
<design_instructions>Create an order tracking interface with a clean status timeline showing Order Placed, Design Review, Printing, Quality Check, and Ready for Pickup/Delivery stages. Display current order details including 3D model preview, provider information, estimated completion time, and real-time status updates. Include an integrated messaging system for provider communication with chat bubbles. Use emerald green for completed stages and active status indicators. Maintain consistent Inter typography and dark theme. Add notification badges for new messages and status updates.</design_instructions>
</create_component>

<edit_component>
<file_path>src/components/blocks/footers/centered-with-logo.tsx</file_path>
<design_instructions>Update the footer for the 3D printing platform. Replace the logo with "PrintHub" branding. Update navigation links to include: Browse Printers, How It Works, Pricing, Become a Provider, Support, and Blog. Add a section for "For Providers" and "For Customers" with relevant links. Include social media icons and contact information. Use Inter font family and maintain the dark theme with emerald accent colors for links and hover states. Keep the clean, centered layout structure.</design_instructions>
<references>src/components/blocks/footers/centered-with-logo.tsx</references>
</edit_component>
</components>